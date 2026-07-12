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

const CM: Record<string, string> = {
  red:    'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  blue:   'bg-blue-100 text-blue-700',
  gray:   'bg-slate-100 text-slate-600',
  green:  'bg-green-100 text-green-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  amber:  'bg-amber-100 text-amber-700',
  teal:   'bg-teal-100 text-teal-700',
  orange: 'bg-orange-100 text-orange-700',
};

/* ── Navbar ─────────────────────────────────────────────────── */
function FeedNav({ user, t }: { user: unknown; t: (a:string,b:string,c:string)=>string }) {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Left: logo + label */}
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
        {/* Right: auth */}
        <div className="flex items-center gap-1.5 shrink-0">
          {user ? (
            <Link href="/dashboard/student"
              className="h-9 px-4 bg-green-700 text-white text-xs font-bold rounded-xl hover:bg-green-800 transition-colors flex items-center">
              {t('Dashboard','ダッシュボード','ড্যাশবোর্ড')}
            </Link>
          ) : (
            <>
              <Link href="/auth/login"
                className="h-9 px-3 text-slate-600 text-xs font-semibold hover:text-slate-900 transition-colors hidden sm:flex items-center">
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
  const hasFilter = !!(country || purpose || type);
  const activeCount = [country, purpose, type].filter(Boolean).length;

  const clearAll = () => { setCountry(''); setPurpose(''); setType(''); };

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <FeedNav user={user} t={t} />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0d1a12] via-[#0f2a18] to-[#0d1a12] px-4 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto text-center">
          <span className="inline-block text-green-400 text-[10px] font-black tracking-[0.2em] uppercase mb-3 px-3 py-1 rounded-full border border-green-800/60 bg-green-900/30">
            {t('Tensai Knowledge Hub','Tensai 知識ハブ','Tensai নলেজ হাব')}
          </span>
          <h1 className="text-[1.75rem] sm:text-4xl font-black text-white leading-tight mb-3">
            {t('Your Study Abroad Guide','海外留学ガイド','বিদেশে পড়াশোনার গাইড')}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            {t(
              'Videos, articles, and tips for studying in Japan, Australia, Canada and beyond.',
              '日本・オーストラリア・カナダなど、海外留学に役立つ動画・記事を厳選。',
              'জাপান, অস্ট্রেলিয়া, কানাডাসহ বিদেশে পড়াশোনার ভিডিও, আর্টিকেল ও টিপস।'
            )}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-6">

        {/* ── Filter panel ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-5 overflow-hidden">

          {/* Mobile filter toggle bar */}
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3.5 sm:hidden"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          {/* Filter rows — always visible on sm+, collapsible on mobile */}
          <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block`}>

            {/* Country */}
            <div className="px-4 py-3 border-t border-slate-50 sm:border-t-0 sm:border-b sm:border-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                {t('Country','国','দেশ')}
              </p>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                {countries.map(c => (
                  <button key={c.slug}
                    onClick={() => setCountry(country === c.slug ? '' : c.slug)}
                    className={`shrink-0 h-8 px-3 rounded-full text-xs font-bold border transition-all
                      ${country === c.slug
                        ? 'bg-green-700 text-white border-green-700'
                        : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-green-300 hover:bg-green-50'}`}>
                    {c.flag} {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Purpose */}
            <div className="px-4 py-3 border-t border-slate-50 sm:border-b sm:border-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                {t('Purpose','目的','উদ্দেশ্য')}
              </p>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                {purposes.map(p => (
                  <button key={p.slug}
                    onClick={() => setPurpose(purpose === p.slug ? '' : p.slug)}
                    className={`shrink-0 h-8 px-3 rounded-full text-xs font-bold border transition-all
                      ${purpose === p.slug
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                    {p.flag} {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Type + clear */}
            <div className="px-4 py-3 border-t border-slate-50 flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-full sm:w-auto sm:mr-1">
                {t('Content Type','タイプ','ধরন')}
              </p>
              <div className="flex gap-1.5">
                {([['video','🎬','Video'],['article','📰','Article'],['text','✍️','Post']] as const).map(([v,e,l]) => (
                  <button key={v}
                    onClick={() => setType(type === v ? '' : v)}
                    className={`shrink-0 h-8 px-3 rounded-full text-xs font-bold border transition-all
                      ${type === v
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-400'}`}>
                    {e} {l}
                  </button>
                ))}
              </div>
              {hasFilter && (
                <button onClick={clearAll}
                  className="ml-auto h-8 px-3 text-xs font-bold text-red-500 hover:text-red-700 border border-red-100 rounded-full hover:bg-red-50 transition-all">
                  ✕ {t('Clear all','クリア','সব মুছুন')}
                </button>
              )}
            </div>
          </div>

          {/* Active filter chips strip (mobile summary when collapsed) */}
          {hasFilter && !filtersOpen && (
            <div className="sm:hidden flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
              {country && (
                <span className="shrink-0 flex items-center gap-1 h-6 px-2.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold">
                  {countries.find(c=>c.slug===country)?.flag} {countries.find(c=>c.slug===country)?.name}
                  <button onClick={() => setCountry('')} className="ml-0.5 text-green-500 hover:text-green-800">✕</button>
                </span>
              )}
              {purpose && (
                <span className="shrink-0 flex items-center gap-1 h-6 px-2.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold">
                  {purposes.find(p=>p.slug===purpose)?.flag} {purposes.find(p=>p.slug===purpose)?.name}
                  <button onClick={() => setPurpose('')} className="ml-0.5 text-indigo-400 hover:text-indigo-700">✕</button>
                </span>
              )}
              {type && (
                <span className="shrink-0 flex items-center gap-1 h-6 px-2.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold capitalize">
                  {type}
                  <button onClick={() => setType('')} className="ml-0.5 text-slate-400 hover:text-slate-700">✕</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Posts ────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                <div className="h-44 sm:h-48 bg-slate-100" />
                <div className="p-4 space-y-2.5">
                  <div className="flex gap-1.5">
                    <div className="h-4 bg-slate-100 rounded-full w-16" />
                    <div className="h-4 bg-slate-100 rounded-full w-12" />
                  </div>
                  <div className="h-4 bg-slate-100 rounded w-full" />
                  <div className="h-4 bg-slate-100 rounded w-4/5" />
                  <div className="h-3 bg-slate-100 rounded w-3/4 mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 sm:py-28">
            <div className="text-5xl mb-4">📭</div>
            <p className="font-black text-slate-600 text-lg mb-1">
              {t('No posts found','投稿が見つかりません','কোনো পোস্ট পাওয়া যায়নি')}
            </p>
            <p className="text-slate-400 text-sm mb-5">
              {t('Try a different filter.','別のフィルターをお試しください。','অন্য ফিল্টার চেষ্টা করুন।')}
            </p>
            {hasFilter && (
              <button onClick={clearAll}
                className="px-5 py-2.5 bg-green-700 text-white text-sm font-bold rounded-xl hover:bg-green-800 transition-colors">
                {t('Clear Filters','フィルターをクリア','ফিল্টার মুছুন')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} user={user} t={t}
                featured={i === 0 && !hasFilter && posts.length >= 3} />
            ))}
          </div>
        )}

        {/* ── Guest CTA ─────────────────────────────────────────── */}
        {!user && posts.length > 0 && (
          <div className="mt-8 sm:mt-10 rounded-2xl overflow-hidden bg-gradient-to-br from-[#0d2414] to-green-800 px-5 sm:px-8 py-8 sm:py-10 text-center">
            <span className="inline-block text-green-300 text-[10px] font-black tracking-[0.2em] uppercase mb-3 px-3 py-1 rounded-full border border-green-700/60 bg-green-900/40">
              {t('Free Account','無料アカウント','ফ্রি অ্যাকাউন্ট')}
            </span>
            <p className="font-black text-white text-xl sm:text-2xl mb-2 leading-tight">
              {t('Unlock every article & video','全記事・動画を無料で閲覧','সব কনটেন্ট আনলক করুন')}
            </p>
            <p className="text-green-200 text-sm mb-6 max-w-md mx-auto leading-relaxed">
              {t(
                'Create a free Tensai account to read full articles, watch videos, and apply to schools abroad.',
                '無料登録して記事・動画の全コンテンツと留学サポートをご利用ください。',
                'ফ্রি Tensai অ্যাকাউন্ট তৈরি করুন — আর্টিকেল পড়ুন, ভিডিও দেখুন, বিদেশে আবেদন করুন।'
              )}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/auth/register"
                className="h-11 px-8 bg-white text-green-800 font-black rounded-xl text-sm hover:bg-green-50 transition-colors flex items-center justify-center">
                {t('Create Free Account','無料で登録','ফ্রি অ্যাকাউন্ট তৈরি')}
              </Link>
              <Link href="/auth/login"
                className="h-11 px-8 bg-green-900/50 text-white font-bold rounded-xl text-sm border border-green-600 hover:bg-green-900/70 transition-colors flex items-center justify-center">
                {t('Sign In','サインイン','সাইন ইন')}
              </Link>
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

/* ── Post card ───────────────────────────────────────────────── */
function PostCard({ post, user, t, featured }: {
  post: Post;
  user: unknown;
  t: (a:string,b:string,c:string)=>string;
  featured?: boolean;
}) {
  const typeLabel = post.type === 'video'   ? t('Video','動画','ভিডিও')
                  : post.type === 'article' ? t('Article','記事','আর্টিকেল')
                  :                           t('Post','投稿','পোস্ট');
  const typeIcon  = post.type === 'video' ? '🎬' : post.type === 'article' ? '📰' : '✍️';
  const isGuest   = !user;

  return (
    <Link href={`/feed/${post.slug}`}
      className={`group flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden
        hover:shadow-md hover:border-green-200 transition-all duration-200 active:scale-[0.99]
        ${featured ? 'sm:col-span-2 lg:col-span-3 sm:flex-row' : ''}`}>

      {/* ── Image ── */}
      <div className={`relative bg-slate-100 overflow-hidden shrink-0
        ${featured ? 'h-52 sm:h-auto sm:w-[45%]' : 'h-44 sm:h-48'}`}>

        {post.thumbnail
          ? <img src={post.thumbnail} alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <span className="text-5xl opacity-20">{typeIcon}</span>
            </div>
        }

        {/* Play button (video, authenticated) */}
        {post.type === 'video' && !isGuest && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center
              group-hover:bg-black/70 group-hover:scale-110 transition-all duration-200">
              <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        )}

        {/* Lock badge (guests only) */}
        {isGuest && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-black/65 backdrop-blur-sm rounded-full px-2.5 py-1">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <span className="text-[10px] font-bold text-white leading-none">
              {t('Login to read','ログインで読む','লগইন করুন')}
            </span>
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {typeIcon} {typeLabel}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-2.5">
          {post.categories.slice(0, 3).map(c => (
            <span key={c.slug}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CM[c.color] ?? 'bg-slate-100 text-slate-600'}`}>
              {c.flag} {c.name}
            </span>
          ))}
        </div>

        <h3 className={`font-black text-slate-900 leading-snug mb-2
          group-hover:text-green-700 transition-colors line-clamp-2
          ${featured ? 'text-base sm:text-xl' : 'text-sm sm:text-[0.9rem]'}`}>
          {post.title}
        </h3>

        <p className={`text-slate-500 leading-relaxed flex-1 line-clamp-2 sm:line-clamp-3
          ${featured ? 'text-sm' : 'text-xs'}`}>
          {post.excerpt}
        </p>

        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-400">
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString(undefined,{dateStyle:'medium'})
              : ''}
          </span>
          <span className={`font-black text-green-700 group-hover:underline shrink-0
            ${featured ? 'text-sm' : 'text-xs'}`}>
            {post.type === 'video'
              ? t('Watch →','視聴 →','দেখুন →')
              : t('Read →','読む →','পড়ুন →')}
          </span>
        </div>
      </div>
    </Link>
  );
}
