'use client';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';

interface Category { name: string; slug: string; type: string; flag: string; color: string; }
interface Post {
  id: number; title: string; slug: string; type: string;
  excerpt: string; thumbnail: string | null; youtube_id: string | null;
  published_at: string; categories: Category[]; locked: boolean; is_premium: boolean;
}

function catChip(c: Category) {
  if (c.type === 'country') return 'bg-emerald-50 text-emerald-700';
  if (c.type === 'purpose') return 'bg-violet-50 text-violet-700';
  return 'bg-slate-100 text-slate-500';
}

function isNew(published_at: string) {
  return Date.now() - new Date(published_at).getTime() < 7 * 24 * 60 * 60 * 1000;
}

function readTime(type: string, excerpt: string) {
  if (type === 'video') return null;
  const words = excerpt.split(' ').length;
  const mins = Math.max(3, Math.round(words / 40));
  return `${mins} min read`;
}

/* ── Navbar ─────────────────────────────────────────────────── */
function FeedNav({ user, t }: { user: unknown; t: (a:string,b:string,c:string)=>string }) {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-green-700 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm">T</span>
            </div>
            <span className="font-black text-slate-900 text-base hidden sm:block leading-none">Tensai</span>
          </Link>
          <svg className="w-3 h-3 text-slate-300 hidden sm:block shrink-0" fill="none" viewBox="0 0 8 12">
            <path d="M1 1l6 5-6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="text-sm font-bold text-green-700 truncate">
            {t('Study Guide','留学ガイド','স্টাডি গাইড')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {user ? (
            <Link href="/dashboard/student"
              className="h-9 px-4 bg-green-700 text-white text-xs font-bold rounded-xl hover:bg-green-800 transition-colors flex items-center">
              {t('Dashboard','ダッシュボード','ড্যাশবোর্ড')}
            </Link>
          ) : (
            <>
              <Link href="/auth/login"
                className="h-9 px-3 text-slate-500 text-xs font-semibold hover:text-slate-900 transition-colors hidden sm:flex items-center">
                {t('Sign In','サインイン','সাইন ইন')}
              </Link>
              <Link href="/auth/register"
                className="h-9 px-4 bg-green-700 text-white text-xs font-bold rounded-xl hover:bg-green-800 transition-colors flex items-center whitespace-nowrap">
                {t('Join Free','無料登録','ফ্রি যোগ দিন')}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ── Page export ─────────────────────────────────────────────── */
export default function FeedPage() {
  return <Suspense><FeedInner /></Suspense>;
}

function FeedInner() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const t = (en: string, ja: string, bn: string) => lang === 'ja' ? ja : lang === 'bn' ? bn : en;
  const searchParams = useSearchParams();

  const [country, setCountry] = useState('');
  const [purpose, setPurpose] = useState('');
  const [type,    setType]    = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setCountry(searchParams.get('country') ?? '');
    setPurpose(searchParams.get('purpose') ?? '');
    setType(searchParams.get('type')    ?? '');
  }, [searchParams]);

  const { data: cats } = useQuery({
    queryKey: ['feed-categories'],
    queryFn: () => api.get('/feed-categories').then(r => r.data),
    staleTime: 300_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['feed', country, purpose, type],
    queryFn: () => api.get('/feed', {
      params: {
        country: country || undefined,
        purpose: purpose || undefined,
        type:    type    || undefined,
      },
    }).then(r => r.data),
    staleTime: 60_000,
  });

  const posts: Post[]         = data?.data    ?? [];
  const countries: Category[] = cats?.countries ?? [];
  const purposes: Category[]  = cats?.purposes  ?? [];
  const total: number         = data?.total    ?? 0;
  const hasFilter = !!(country || purpose || type);
  const activeCount = [country, purpose, type].filter(Boolean).length;

  const clearAll = () => { setCountry(''); setPurpose(''); setType(''); };

  const featuredPost  = !hasFilter && posts.length >= 3 ? posts[0] : null;
  const remainingPosts = featuredPost ? posts.slice(1) : posts;

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <FeedNav user={user} t={t} />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[#0b1812] px-4 py-12 sm:py-16">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0b1812]/80" />
        <div className="relative max-w-6xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 text-green-400 text-[10px] font-black tracking-[0.18em] uppercase mb-4 px-3.5 py-1.5 rounded-full border border-green-800/50 bg-green-950/60">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
            {t('Tensai Knowledge Hub','Tensai 知識ハブ','Tensai নলেজ হাব')}
          </span>
          <h1 className="text-3xl sm:text-[2.5rem] font-black text-white leading-[1.1] tracking-tight mb-3">
            {t('Your Study Abroad Guide','海外留学ガイド','বিদেশে পড়াশোনার গাইড')}
          </h1>
          <p className="text-slate-400 text-sm sm:text-[0.95rem] max-w-md mx-auto leading-relaxed">
            {t(
              'Videos, articles, and tips for studying in Japan, Australia, Canada and beyond.',
              '日本・オーストラリア・カナダなど、海外留学に役立つ動画・記事を厳選。',
              'জাপান, অস্ট্রেলিয়া, কানাডাসহ বিদেশে পড়াশোনার ভিডিও, আর্টিকেল ও টিপস।'
            )}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-7">

        {/* ── Filter panel ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(15,23,42,0.07)] ring-1 ring-slate-100/80 mb-6 overflow-hidden">

          {/* Mobile toggle */}
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 sm:hidden"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-700">
                {t('Filter','フィルター','ফিল্টার')}
              </span>
              {activeCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 bg-green-700 text-white text-[10px] font-black rounded-full">
                  {activeCount}
                </span>
              )}
            </div>
            <svg className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          {/* Filter rows — inline label layout on desktop, stacked on mobile */}
          <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block px-5 sm:px-6 py-4 sm:py-5 space-y-3.5`}>

            {/* Destination */}
            <div className="flex items-start gap-0 sm:gap-5">
              <span className="hidden sm:block text-[10px] font-black text-slate-300 uppercase tracking-widest w-24 shrink-0 pt-2.5">
                {t('Destination','目的地','গন্তব্য')}
              </span>
              <div className="w-full">
                <p className="sm:hidden text-[9px] font-black text-slate-300 uppercase tracking-[0.18em] mb-2">
                  {t('Destination','目的地','গন্তব্য')}
                </p>
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
                  {countries.map(c => (
                    <button key={c.slug}
                      onClick={() => setCountry(country === c.slug ? '' : c.slug)}
                      className={`shrink-0 h-9 px-4 rounded-full text-[0.8rem] font-semibold transition-all duration-150
                        ${country === c.slug
                          ? 'bg-green-700 text-white shadow-[0_2px_8px_rgba(21,128,61,0.35)]'
                          : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200/80 hover:ring-green-200 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                      {c.flag} {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-50" />

            {/* Purpose */}
            <div className="flex items-start gap-0 sm:gap-5">
              <span className="hidden sm:block text-[10px] font-black text-slate-300 uppercase tracking-widest w-24 shrink-0 pt-2.5">
                {t('Purpose','目的','উদ্দেশ্য')}
              </span>
              <div className="w-full">
                <p className="sm:hidden text-[9px] font-black text-slate-300 uppercase tracking-[0.18em] mb-2">
                  {t('Purpose','目的','উদ্দেশ্য')}
                </p>
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
                  {purposes.map(p => (
                    <button key={p.slug}
                      onClick={() => setPurpose(purpose === p.slug ? '' : p.slug)}
                      className={`shrink-0 h-9 px-4 rounded-full text-[0.8rem] font-semibold transition-all duration-150
                        ${purpose === p.slug
                          ? 'bg-violet-600 text-white shadow-[0_2px_8px_rgba(124,58,237,0.30)]'
                          : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200/80 hover:ring-violet-200 hover:bg-violet-50 hover:text-violet-700'}`}>
                      {p.flag} {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-50" />

            {/* Format + Clear */}
            <div className="flex items-start gap-0 sm:gap-5">
              <span className="hidden sm:block text-[10px] font-black text-slate-300 uppercase tracking-widest w-24 shrink-0 pt-2.5">
                {t('Format','形式','ফরম্যাট')}
              </span>
              <div className="flex-1">
                <p className="sm:hidden text-[9px] font-black text-slate-300 uppercase tracking-[0.18em] mb-2">
                  {t('Format','形式','ফরম্যাট')}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {([['video','🎬','Video'],['article','📰','Article'],['text','✍️','Post']] as const).map(([v,e,l]) => (
                    <button key={v}
                      onClick={() => setType(type === v ? '' : v)}
                      className={`shrink-0 h-9 px-4 rounded-full text-[0.8rem] font-semibold transition-all duration-150
                        ${type === v
                          ? 'bg-slate-800 text-white shadow-[0_2px_8px_rgba(15,23,42,0.20)]'
                          : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200/80 hover:ring-slate-300 hover:bg-slate-100'}`}>
                      {e} {l}
                    </button>
                  ))}
                  {hasFilter && (
                    <button onClick={clearAll}
                      className="ml-2 h-9 px-4 text-[0.8rem] font-semibold text-slate-400 hover:text-red-500 ring-1 ring-slate-200/80 rounded-full hover:ring-red-200 hover:bg-red-50 transition-all duration-150">
                      ✕ {t('Clear all','クリア','সব মুছুন')}
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Active chips strip — mobile only, when collapsed */}
          {hasFilter && !filtersOpen && (
            <div className="sm:hidden flex items-center gap-2 px-5 pb-4 overflow-x-auto scrollbar-none">
              {country && (
                <span className="shrink-0 flex items-center gap-1 h-7 px-3 rounded-full bg-emerald-50 ring-1 ring-emerald-200 text-emerald-700 text-[11px] font-bold">
                  {countries.find(c=>c.slug===country)?.flag} {countries.find(c=>c.slug===country)?.name}
                  <button onClick={() => setCountry('')} className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity">✕</button>
                </span>
              )}
              {purpose && (
                <span className="shrink-0 flex items-center gap-1 h-7 px-3 rounded-full bg-violet-50 ring-1 ring-violet-200 text-violet-700 text-[11px] font-bold">
                  {purposes.find(p=>p.slug===purpose)?.flag} {purposes.find(p=>p.slug===purpose)?.name}
                  <button onClick={() => setPurpose('')} className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity">✕</button>
                </span>
              )}
              {type && (
                <span className="shrink-0 flex items-center gap-1 h-7 px-3 rounded-full bg-slate-100 ring-1 ring-slate-200 text-slate-600 text-[11px] font-bold capitalize">
                  {type}
                  <button onClick={() => setType('')} className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity">✕</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Posts ────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-[340px] sm:h-[420px] bg-white rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                  <div className="h-44 sm:h-48 bg-slate-100" />
                  <div className="p-4 space-y-2.5">
                    <div className="flex gap-1.5"><div className="h-4 bg-slate-100 rounded-full w-16"/><div className="h-4 bg-slate-100 rounded-full w-12"/></div>
                    <div className="h-4 bg-slate-100 rounded w-full"/>
                    <div className="h-4 bg-slate-100 rounded w-4/5"/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 sm:py-28">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p className="font-black text-slate-700 text-lg mb-1">
              {t('No results','投稿が見つかりません','কোনো ফলাফল নেই')}
            </p>
            <p className="text-slate-400 text-sm mb-6">
              {t('Try adjusting your filters.','別のフィルターをお試しください。','ফিল্টার পরিবর্তন করে দেখুন।')}
            </p>
            {hasFilter && (
              <button onClick={clearAll}
                className="px-5 py-2.5 bg-green-700 text-white text-sm font-bold rounded-xl hover:bg-green-800 transition-colors">
                {t('Clear Filters','フィルターをクリア','ফিল্টার মুছুন')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">

            {/* ── Featured hero card ─────────────────────────── */}
            {featuredPost && (
              <FeaturedCard post={featuredPost} user={user} t={t} />
            )}

            {/* ── Section label ──────────────────────────────── */}
            {remainingPosts.length > 0 && (
              <div className="flex items-center justify-between pt-1 pb-0.5">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">
                  {featuredPost
                    ? t('More Articles & Videos','その他のコンテンツ','আরও কনটেন্ট')
                    : t(`${total} Result${total !== 1 ? 's' : ''}`, `${total}件`, `${total}টি ফলাফল`)}
                </p>
                {!hasFilter && (
                  <span className="text-[11px] text-slate-300 font-medium">
                    {t(`${total} total`, `全${total}本`, `মোট ${total}টি`)}
                  </span>
                )}
              </div>
            )}

            {/* ── Grid ───────────────────────────────────────── */}
            {remainingPosts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {remainingPosts.map(post => (
                  <PostCard key={post.id} post={post} user={user} t={t} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Guest CTA ─────────────────────────────────────────── */}
        {!user && posts.length > 0 && (
          <div className="mt-8 sm:mt-10 rounded-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-[#0b1e11]" />
            <div className="absolute inset-0 opacity-[0.035]"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative px-5 sm:px-10 py-9 sm:py-12 text-center">
              <span className="inline-flex items-center gap-1.5 text-green-400 text-[10px] font-black tracking-[0.18em] uppercase mb-4 px-3 py-1 rounded-full border border-green-800/50 bg-green-950/60">
                <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
                {t('Free Account','無料アカウント','ফ্রি অ্যাকাউন্ট')}
              </span>
              <p className="font-black text-white text-xl sm:text-2xl mb-2.5 leading-tight tracking-tight">
                {t('Unlock every article & video','全記事・動画を無料で閲覧','সব কনটেন্ট আনলক করুন')}
              </p>
              <p className="text-slate-400 text-sm mb-7 max-w-sm mx-auto leading-relaxed">
                {t(
                  'Create a free account to read full articles, watch videos, and apply to schools abroad.',
                  '無料登録して全コンテンツと留学サポートをご利用ください。',
                  'ফ্রি অ্যাকাউন্টে আর্টিকেল পড়ুন, ভিডিও দেখুন, বিদেশে আবেদন করুন।'
                )}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-2.5">
                <Link href="/auth/register"
                  className="h-11 px-8 bg-white text-slate-900 font-black rounded-xl text-sm hover:bg-slate-100 transition-colors flex items-center justify-center">
                  {t('Create Free Account','無料で登録','ফ্রি অ্যাকাউন্ট তৈরি')}
                </Link>
                <Link href="/auth/login"
                  className="h-11 px-8 bg-white/8 text-white font-semibold rounded-xl text-sm border border-white/12 hover:bg-white/12 transition-colors flex items-center justify-center">
                  {t('Sign In','サインイン','সাইন ইন')}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="mt-10 pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <Link href="/" className="flex items-center gap-1.5 hover:text-slate-600 transition-colors">
            <div className="w-5 h-5 rounded bg-green-700 flex items-center justify-center">
              <span className="text-white font-black text-[9px]">T</span>
            </div>
            <span className="font-bold">Tensai</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/about"   className="hover:text-slate-600 transition-colors">{t('About','概要','সম্পর্কে')}</Link>
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">{t('Privacy','プライバシー','গোপনীয়তা')}</Link>
            <Link href="/terms"   className="hover:text-slate-600 transition-colors">{t('Terms','規約','শর্ত')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Featured hero card ──────────────────────────────────────── */
function FeaturedCard({ post, user, t }: {
  post: Post;
  user: unknown;
  t: (a:string,b:string,c:string)=>string;
}) {
  const typeIcon  = post.type === 'video' ? '🎬' : post.type === 'article' ? '📰' : '✍️';
  const isLocked  = post.is_premium && !user;

  return (
    <Link href={`/feed/${post.slug}`}
      className="group relative block w-full rounded-2xl overflow-hidden
        shadow-[0_2px_12px_rgba(15,23,42,0.10)] hover:shadow-[0_12px_40px_rgba(15,23,42,0.16)]
        transition-all duration-300 active:scale-[0.995]"
      style={{ height: 'clamp(280px, 45vw, 440px)' }}>

      {/* Background image */}
      {post.thumbnail
        ? <img src={post.thumbnail} alt={post.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out" />
        : <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
      }

      {/* Gradient overlay — stronger at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

      {/* Top badges */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span className="bg-amber-500 text-white text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full shadow-sm">
          {t('Featured','注目','ফিচার্ড')}
        </span>
        {post.published_at && isNew(post.published_at) && (
          <span className="bg-green-500 text-white text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full shadow-sm">
            {t('New','新着','নতুন')}
          </span>
        )}
      </div>
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold px-2.5 py-1 rounded-full">
        {typeIcon} {post.type === 'video' ? t('Video','動画','ভিডিও') : post.type === 'article' ? t('Article','記事','আর্টিকেল') : t('Post','投稿','পোস্ট')}
      </div>

      {/* Premium badge */}
      {post.is_premium && (
        <div className="absolute top-12 right-4 mt-1 flex items-center gap-1 bg-amber-500/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          <span className="text-[9px] font-black text-white tracking-wide uppercase">
            {t('Premium','プレミアム','প্রিমিয়াম')}
          </span>
        </div>
      )}

      {/* Video play button */}
      {post.type === 'video' && !isLocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center
            group-hover:bg-white/25 group-hover:scale-110 transition-all duration-300 shadow-xl">
            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.categories.slice(0, 3).map(c => (
            <span key={c.slug}
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-white border border-white/20">
              {c.flag} {c.name}
            </span>
          ))}
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-3xl font-black text-white leading-[1.15] tracking-tight mb-2.5 max-w-3xl
          group-hover:text-green-300 transition-colors duration-200">
          {post.title}
        </h2>

        {/* Excerpt */}
        <p className="text-white/65 text-sm sm:text-[0.9rem] leading-relaxed line-clamp-2 max-w-2xl mb-4 hidden sm:block">
          {post.excerpt}
        </p>

        {/* Footer row */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 h-9 px-5 bg-green-700 hover:bg-green-600 text-white text-xs font-black rounded-xl transition-colors shadow-lg">
            {post.type === 'video'
              ? <>{t('Watch Now','今すぐ視聴','এখন দেখুন')} <span className="ml-0.5">▶</span></>
              : <>{t('Read Now','今すぐ読む','এখন পড়ুন')} <span className="ml-0.5">→</span></>}
          </span>
          {post.published_at && (
            <span className="text-white/45 text-xs font-medium">
              {new Date(post.published_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── Regular post card ───────────────────────────────────────── */
function PostCard({ post, user, t }: {
  post: Post;
  user: unknown;
  t: (a:string,b:string,c:string)=>string;
}) {
  const typeLabel = post.type === 'video'   ? t('Video','動画','ভিডিও')
                  : post.type === 'article' ? t('Article','記事','আর্টিকেল')
                  :                           t('Post','投稿','পোস্ট');
  const typeIcon  = post.type === 'video' ? '🎬' : post.type === 'article' ? '📰' : '✍️';
  const isLocked  = post.is_premium && !user;
  const rt        = readTime(post.type, post.excerpt);
  const fresh     = post.published_at && isNew(post.published_at);

  return (
    <Link href={`/feed/${post.slug}`}
      className="group flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden
        shadow-[0_1px_4px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.10)]
        hover:border-green-100 transition-all duration-200 active:scale-[0.99]">

      {/* Image */}
      <div className="relative bg-slate-100 overflow-hidden shrink-0 h-44 sm:h-48">
        {post.thumbnail
          ? <img src={post.thumbnail} alt={post.title}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out" />
          : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
              <span className="text-5xl opacity-10">{typeIcon}</span>
            </div>
        }

        {/* Top-left badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {fresh && (
            <span className="bg-green-500 text-white text-[9px] font-black tracking-wide uppercase px-2 py-0.5 rounded-full shadow-sm">
              {t('New','新','নতুন')}
            </span>
          )}
        </div>

        {/* Play button */}
        {post.type === 'video' && !isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center
              group-hover:bg-black/65 group-hover:scale-110 transition-all duration-200 shadow-lg">
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        )}

        {/* Premium badge */}
        {post.is_premium && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-amber-500/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <span className="text-[10px] font-black text-white leading-none">
              {t('Premium','プレミアム','প্রিমিয়াম')}
            </span>
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
          {typeIcon} {typeLabel}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Category chips */}
        <div className="flex flex-wrap gap-1 mb-2.5">
          {post.categories.slice(0, 3).map(c => (
            <span key={c.slug} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catChip(c)}`}>
              {c.flag} {c.name}
            </span>
          ))}
        </div>

        <h3 className="font-black text-slate-900 leading-snug mb-2
          group-hover:text-green-700 transition-colors duration-150 line-clamp-2 text-sm sm:text-[0.9rem]">
          {post.title}
        </h3>

        <p className="text-slate-400 text-[0.8125rem] leading-relaxed flex-1 line-clamp-2 sm:line-clamp-3">
          {post.excerpt}
        </p>

        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-300 font-medium">
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
                : ''}
            </span>
            {rt && (
              <>
                <span className="text-slate-200">·</span>
                <span className="text-[10px] text-slate-300 font-medium">{rt}</span>
              </>
            )}
          </div>
          <span className="font-black text-green-700 group-hover:text-green-600 shrink-0 text-xs transition-colors">
            {post.type === 'video' ? t('Watch →','視聴 →','দেখুন →') : t('Read →','読む →','পড়ুন →')}
          </span>
        </div>
      </div>
    </Link>
  );
}
