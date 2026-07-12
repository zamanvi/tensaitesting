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

const COLOR_MAP: Record<string, string> = {
  red: 'bg-red-100 text-red-700', yellow: 'bg-yellow-100 text-yellow-700',
  blue: 'bg-blue-100 text-blue-700', gray: 'bg-slate-100 text-slate-600',
  green: 'bg-green-100 text-green-700', indigo: 'bg-indigo-100 text-indigo-700',
  amber: 'bg-amber-100 text-amber-700', teal: 'bg-teal-100 text-teal-700',
  orange: 'bg-orange-100 text-orange-700',
};

export default function FeedPage() {
  return (
    <Suspense>
      <FeedInner />
    </Suspense>
  );
}

function FeedInner() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const t = (en: string, ja: string, bn: string) => lang === 'ja' ? ja : lang === 'bn' ? bn : en;
  const searchParams = useSearchParams();

  const [country, setCountry] = useState('');
  const [purpose, setPurpose] = useState('');
  const [type, setType]       = useState('');

  useEffect(() => {
    setCountry(searchParams.get('country') ?? '');
    setPurpose(searchParams.get('purpose') ?? '');
    setType(searchParams.get('type') ?? '');
  }, [searchParams]);

  const { data: cats } = useQuery({
    queryKey: ['feed-categories'],
    queryFn: () => api.get('/feed-categories').then(r => r.data),
    staleTime: 300_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['feed', country, purpose, type],
    queryFn: () => api.get('/feed', {
      params: { country: country || undefined, purpose: purpose || undefined, type: type || undefined },
    }).then(r => r.data),
    staleTime: 60_000,
  });

  const posts: Post[]       = data?.data ?? [];
  const countries: Category[] = cats?.countries ?? [];
  const purposes: Category[]  = cats?.purposes  ?? [];
  const hasFilter = country || purpose || type;

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-green-700 flex items-center justify-center">
                <span className="text-white font-black text-xs">T</span>
              </div>
              <span className="font-black text-slate-900 text-sm hidden sm:block">Tensai</span>
            </Link>
            <span className="text-slate-200 text-lg hidden sm:block">|</span>
            <span className="text-sm font-bold text-green-700">
              {t('Study Guide', '留学ガイド', 'স্টাডি গাইড')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard/student"
                className="px-3 py-1.5 bg-green-700 text-white text-xs font-bold rounded-lg hover:bg-green-800 transition-colors">
                {t('Dashboard →', 'ダッシュボード →', 'ড্যাশবোর্ড →')}
              </Link>
            ) : (
              <>
                <Link href="/auth/login"
                  className="px-3 py-1.5 text-slate-600 text-xs font-semibold hover:text-slate-900 transition-colors">
                  {t('Sign In', 'サインイン', 'সাইন ইন')}
                </Link>
                <Link href="/auth/register"
                  className="px-3 py-1.5 bg-green-700 text-white text-xs font-bold rounded-lg hover:bg-green-800 transition-colors">
                  {t('Join Free', '無料登録', 'ফ্রি যোগ দিন')}
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero banner ────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 py-10 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-green-400 text-xs font-bold tracking-widest uppercase mb-2">
            {t('Tensai Knowledge Hub', 'Tensai 知識ハブ', 'Tensai নলেজ হাব')}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
            {t('Your Study Abroad Guide', '海外留学ガイド', 'বিদেশে পড়াশোনার গাইড')}
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            {t(
              'Videos, articles, and tips to help you plan your journey to Japan, Australia, Canada and more.',
              '日本・オーストラリア・カナダなどへの留学準備に役立つ動画・記事をお届けします。',
              'জাপান, অস্ট্রেলিয়া, কানাডাসহ বিভিন্ন দেশে পড়াশোনার জন্য ভিডিও, আর্টিকেল ও টিপস।'
            )}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ── Filters ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
          {/* Country row */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider w-16 shrink-0">
              {t('Country', '国', 'দেশ')}
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {countries.map(c => (
                <button key={c.slug}
                  onClick={() => setCountry(country === c.slug ? '' : c.slug)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all
                    ${country === c.slug
                      ? 'bg-green-700 text-white border-green-700'
                      : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-green-300 hover:bg-green-50'}`}>
                  {c.flag} {c.name}
                </button>
              ))}
            </div>
          </div>
          {/* Purpose row */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider w-16 shrink-0">
              {t('Purpose', '目的', 'উদ্দেশ্য')}
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {purposes.map(p => (
                <button key={p.slug}
                  onClick={() => setPurpose(purpose === p.slug ? '' : p.slug)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all
                    ${purpose === p.slug
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                  {p.flag} {p.name}
                </button>
              ))}
            </div>
          </div>
          {/* Type + clear row */}
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider w-16 shrink-0">
              {t('Type', 'タイプ', 'ধরন')}
            </span>
            <div className="flex gap-1.5 flex-wrap flex-1">
              {([['video','🎬','Video'],['article','📰','Article'],['text','✍️','Post']] as const).map(([v,e,l]) => (
                <button key={v}
                  onClick={() => setType(type === v ? '' : v)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all
                    ${type === v
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-400'}`}>
                  {e} {l}
                </button>
              ))}
            </div>
            {hasFilter && (
              <button
                onClick={() => { setCountry(''); setPurpose(''); setType(''); }}
                className="text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors ml-auto shrink-0">
                ✕ {t('Clear all', 'クリア', 'মুছুন')}
              </button>
            )}
          </div>
        </div>

        {/* ── Active filter label ─────────────────────────── */}
        {hasFilter && (
          <p className="text-xs text-slate-500 mb-4 font-semibold">
            {t('Showing results for:', '検索結果:', 'ফলাফল দেখাচ্ছে:')}
            {country && <span className="ml-1 text-green-700">{countries.find(c=>c.slug===country)?.flag} {countries.find(c=>c.slug===country)?.name}</span>}
            {purpose && <span className="ml-1 text-indigo-600">{purposes.find(p=>p.slug===purpose)?.flag} {purposes.find(p=>p.slug===purpose)?.name}</span>}
            {type && <span className="ml-1 text-slate-700 capitalize">{type}</span>}
          </p>
        )}

        {/* ── Posts grid ─────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-100" />
                <div className="p-4 space-y-2">
                  <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  <div className="h-4 bg-slate-100 rounded" />
                  <div className="h-3 bg-slate-100 rounded w-5/6" />
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <div className="text-5xl mb-4">📭</div>
            <p className="font-bold text-slate-500 mb-1">
              {t('No posts found', '投稿が見つかりません', 'কোনো পোস্ট পাওয়া যায়নি')}
            </p>
            <p className="text-sm">
              {t('Try a different filter combination.', '別のフィルターをお試しください。', 'অন্য ফিল্টার চেষ্টা করুন।')}
            </p>
            {hasFilter && (
              <button onClick={() => { setCountry(''); setPurpose(''); setType(''); }}
                className="mt-4 px-4 py-2 bg-green-700 text-white text-xs font-bold rounded-lg hover:bg-green-800 transition-colors">
                {t('Clear Filters', 'フィルターをクリア', 'ফিল্টার মুছুন')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} user={user} t={t} featured={i === 0 && !hasFilter} />
            ))}
          </div>
        )}

        {/* ── Guest CTA ───────────────────────────────────── */}
        {!user && posts.length > 0 && (
          <div className="mt-10 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-800 to-green-700 px-6 py-7 text-center">
              <p className="text-green-300 text-xs font-bold tracking-widest uppercase mb-2">
                {t('Free Account', '無料アカウント', 'ফ্রি অ্যাকাউন্ট')}
              </p>
              <p className="font-black text-white text-xl mb-1">
                {t('Unlock every article & video', '全記事・動画を無料で閲覧', 'সব কনটেন্ট আনলক করুন')}
              </p>
              <p className="text-green-200 text-sm mb-5">
                {t(
                  'Create a free Tensai account to read full articles, watch videos, and apply to institutions abroad.',
                  '無料登録して記事全文の閲覧、動画視聴、海外大学への出願ができます。',
                  'ফ্রি Tensai অ্যাকাউন্ট তৈরি করুন — সম্পূর্ণ আর্টিকেল পড়ুন, ভিডিও দেখুন এবং বিদেশে আবেদন করুন।'
                )}
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                <Link href="/auth/register"
                  className="px-6 py-2.5 bg-white text-green-800 font-black rounded-xl text-sm hover:bg-green-50 transition-colors">
                  {t('Create Free Account', '無料で登録', 'ফ্রি অ্যাকাউন্ট তৈরি')}
                </Link>
                <Link href="/auth/login"
                  className="px-6 py-2.5 bg-green-900/40 text-white font-bold rounded-xl text-sm border border-green-600 hover:bg-green-900/60 transition-colors">
                  {t('Sign In', 'サインイン', 'সাইন ইন')}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <Link href="/" className="flex items-center gap-1.5 hover:text-slate-600 transition-colors">
            <div className="w-5 h-5 rounded bg-green-700 flex items-center justify-center">
              <span className="text-white font-black text-[9px]">T</span>
            </div>
            <span className="font-semibold">Tensai</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/about"    className="hover:text-slate-600 transition-colors">{t('About', '会社概要', 'আমাদের সম্পর্কে')}</Link>
            <Link href="/privacy"  className="hover:text-slate-600 transition-colors">{t('Privacy', 'プライバシー', 'গোপনীয়তা')}</Link>
            <Link href="/terms"    className="hover:text-slate-600 transition-colors">{t('Terms', '利用規約', 'শর্তাবলী')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, user, t, featured }: {
  post: Post;
  user: unknown;
  t: (en: string, ja: string, bn: string) => string;
  featured?: boolean;
}) {
  const typeLabel = post.type === 'video' ? t('Video','動画','ভিডিও') : post.type === 'article' ? t('Article','記事','আর্টিকেল') : t('Post','投稿','পোস্ট');
  const isGuest = !user;

  return (
    <Link href={`/feed/${post.slug}`}
      className={`group flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:border-green-200 transition-all duration-200
        ${featured ? 'sm:col-span-2 lg:col-span-3 sm:flex-row' : ''}`}>

      {/* Thumbnail */}
      <div className={`relative bg-slate-100 overflow-hidden shrink-0
        ${featured ? 'sm:w-[42%] h-52 sm:h-auto' : 'h-48'}`}>
        {post.thumbnail ? (
          <img src={post.thumbnail} alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-30">
              {post.type === 'video' ? '🎬' : post.type === 'article' ? '📰' : '✍️'}
            </span>
          </div>
        )}

        {/* Play icon for video (only when NOT locked) */}
        {post.type === 'video' && !isGuest && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm group-hover:bg-black/70 transition-colors">
              <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Lock for guests */}
        {isGuest && (
          <div className="absolute inset-0 bg-slate-900/30 flex items-end p-3 backdrop-blur-[1px]">
            <div className="flex items-center gap-1.5 bg-black/60 rounded-full px-2.5 py-1">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-[10px] font-bold text-white">
                {t('Login to read', 'ログインで読む', 'লগইন করুন')}
              </span>
            </div>
          </div>
        )}

        {/* Type badge top-right */}
        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
          {post.type === 'video' ? '🎬' : post.type === 'article' ? '📰' : '✍️'} {typeLabel}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Category tags */}
        <div className="flex flex-wrap gap-1 mb-2.5">
          {post.categories.slice(0, 3).map(c => (
            <span key={c.slug}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${COLOR_MAP[c.color] ?? 'bg-slate-100 text-slate-600'}`}>
              {c.flag} {c.name}
            </span>
          ))}
        </div>

        <h3 className={`font-black text-slate-900 leading-snug mb-2 group-hover:text-green-700 transition-colors line-clamp-2
          ${featured ? 'text-lg sm:text-xl' : 'text-sm'}`}>
          {post.title}
        </h3>

        <p className={`text-slate-500 leading-relaxed flex-1 line-clamp-3 ${featured ? 'text-sm' : 'text-xs'}`}>
          {post.excerpt}
        </p>

        <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-50">
          <span className="text-[10px] text-slate-400">
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
              : ''}
          </span>
          <span className={`font-bold text-green-700 group-hover:underline ${featured ? 'text-sm' : 'text-xs'}`}>
            {post.type === 'video'
              ? t('Watch →', '視聴 →', 'দেখুন →')
              : t('Read →', '読む →', 'পড়ুন →')}
          </span>
        </div>
      </div>
    </Link>
  );
}
