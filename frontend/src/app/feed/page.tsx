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
  published_at: string; categories: Category[]; locked: boolean;
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_4px_rgba(15,23,42,0.06)] mb-6 overflow-hidden">
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3.5 sm:hidden"
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
              </svg>
              <span className="text-sm font-bold text-slate-700">
                {t('Filters','フィルター','ফিল্টার')}
                {activeCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-green-700 text-white text-[10px] font-black rounded-full">
                    {activeCount}
                  </span>
                )}
              </span>
            </div>
            <svg className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block`}>
            <div className="px-4 py-3 border-t border-slate-50 sm:border-t-0 sm:border-b sm:border-slate-100">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2.5">
                {t('Destination','国・地域','গন্তব্য দেশ')}
              </p>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                {countries.map(c => (
                  <button key={c.slug}
                    onClick={() => setCountry(country === c.slug ? '' : c.slug)}
                    className={`shrink-0 h-8 px-3 rounded-full text-xs font-bold border transition-all duration-150
                      ${country === c.slug
                        ? 'bg-green-700 text-white border-green-700 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-green-200 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                    {c.flag} {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 sm:border-b sm:border-slate-100">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2.5">
                {t('Purpose','目的','উদ্দেশ্য')}
              </p>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                {purposes.map(p => (
                  <button key={p.slug}
                    onClick={() => setPurpose(purpose === p.slug ? '' : p.slug)}
                    className={`shrink-0 h-8 px-3 rounded-full text-xs font-bold border transition-all duration-150
                      ${purpose === p.slug
                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700'}`}>
                    {p.flag} {p.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] w-full sm:w-auto sm:mr-1">
                {t('Format','フォーマット','ফরম্যাট')}
              </p>
              <div className="flex gap-1.5">
                {([['video','🎬','Video'],['article','📰','Article'],['text','✍️','Post']] as const).map(([v,e,l]) => (
                  <button key={v}
                    onClick={() => setType(type === v ? '' : v)}
                    className={`shrink-0 h-8 px-3 rounded-full text-xs font-bold border transition-all duration-150
                      ${type === v
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-300 hover:bg-slate-100'}`}>
                    {e} {l}
                  </button>
                ))}
              </div>
              {hasFilter && (
                <button onClick={clearAll}
                  className="ml-auto h-8 px-3 text-xs font-semibold text-slate-400 hover:text-red-500 border border-slate-100 rounded-full hover:border-red-100 hover:bg-red-50 transition-all duration-150">
                  ✕ {t('Clear','クリア','মুছুন')}
                </button>
              )}
            </div>
          </div>

          {hasFilter && !filtersOpen && (
            <div className="sm:hidden flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
              {country && (
                <span className="shrink-0 flex items-center gap-1 h-6 px-2.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold">
                  {countries.find(c=>c.slug===country)?.flag} {countries.find(c=>c.slug===country)?.name}
                  <button onClick={() => setCountry('')} className="ml-0.5 opacity-60 hover:opacity-100">✕</button>
                </span>
              )}
              {purpose && (
                <span className="shrink-0 flex items-center gap-1 h-6 px-2.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-[11px] font-bold">
                  {purposes.find(p=>p.slug===purpose)?.flag} {purposes.find(p=>p.slug===purpose)?.name}
                  <button onClick={() => setPurpose('')} className="ml-0.5 opacity-60 hover:opacity-100">✕</button>
                </span>
              )}
              {type && (
                <span className="shrink-0 flex items-center gap-1 h-6 px-2.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold capitalize">
                  {type}
                  <button onClick={() => setType('')} className="ml-0.5 opacity-60 hover:opacity-100">✕</button>
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
  const typeIcon = post.type === 'video' ? '🎬' : post.type === 'article' ? '📰' : '✍️';
  const isGuest  = !user;

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

      {/* Lock badge */}
      {isGuest && (
        <div className="absolute top-12 right-4 mt-1 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
          <svg className="w-2.5 h-2.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <span className="text-[9px] font-bold text-white/90">{t('Members only','会員限定','সদস্যদের জন্য')}</span>
        </div>
      )}

      {/* Video play button */}
      {post.type === 'video' && !isGuest && (
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
  const isGuest   = !user;
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
        {post.type === 'video' && !isGuest && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center
              group-hover:bg-black/65 group-hover:scale-110 transition-all duration-200 shadow-lg">
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        )}

        {/* Members-only */}
        {isGuest && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-black/55 backdrop-blur-sm rounded-full px-2.5 py-1">
            <svg className="w-2.5 h-2.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <span className="text-[10px] font-bold text-white/90 leading-none">
              {t('Members only','会員限定','সদস্যদের জন্য')}
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
