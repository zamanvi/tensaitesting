'use client';
import { useQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';

interface Category { name: string; slug: string; type: string; flag: string; color: string; }
interface Post {
  id: number; title: string; slug: string; type: string;
  excerpt: string; body?: string; thumbnail: string | null;
  youtube_id: string | null; video_url?: string;
  published_at: string; categories: Category[]; locked: boolean;
}

export default function FeedPostPage() {
  return (
    <Suspense>
      <PostInner />
    </Suspense>
  );
}

function PostInner() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLang();
  const { user } = useAuthStore();
  const t = (en: string, ja: string, bn: string) => lang === 'ja' ? ja : lang === 'bn' ? bn : en;

  const { data: post, isLoading, isError } = useQuery<Post>({
    queryKey: ['feed-post', slug],
    queryFn: () => api.get(`/feed/${slug}`).then(r => r.data),
    staleTime: 60_000,
  });

  const isLocked = !!post?.locked && !user;

  /* ── Navbar ─────────────────────────────────────────────── */
  const Navbar = () => (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-green-700 flex items-center justify-center">
              <span className="text-white font-black text-xs">T</span>
            </div>
            <span className="font-black text-slate-900 text-sm hidden sm:block">Tensai</span>
          </Link>
          <span className="text-slate-200 hidden sm:block">|</span>
          <Link href="/feed" className="text-sm font-bold text-green-700 hover:underline truncate">
            {t('Guide', 'ガイド', 'গাইড')}
          </Link>
          {post && (
            <>
              <span className="text-slate-300 shrink-0">/</span>
              <span className="text-xs text-slate-500 truncate max-w-[180px] hidden sm:block">{post.title}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <Link href="/dashboard/student"
              className="px-3 py-1.5 bg-green-700 text-white text-xs font-bold rounded-lg hover:bg-green-800 transition-colors">
              {t('Dashboard →', 'ダッシュボード', 'ড্যাশবোর্ড')}
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
  );

  /* ── Loading ─────────────────────────────────────────────── */
  if (isLoading) return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse space-y-4">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-7 bg-slate-200 rounded w-4/5" />
        <div className="h-5 bg-slate-200 rounded w-2/3" />
        <div className="h-72 bg-slate-200 rounded-2xl" />
        {[...Array(5)].map((_,i) => <div key={i} className="h-3 bg-slate-200 rounded" style={{width:`${70+i*5}%`}} />)}
      </div>
    </div>
  );

  /* ── Error ───────────────────────────────────────────────── */
  if (isError || !post) return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <p className="font-black text-slate-700 text-xl mb-2">
          {t('Post not found', '記事が見つかりません', 'পোস্ট পাওয়া যায়নি')}
        </p>
        <p className="text-slate-400 text-sm mb-6">
          {t('It may have been removed or the link is incorrect.', 'リンクが無効か削除された可能性があります。', 'পোস্টটি সরানো হয়েছে বা লিংক ভুল।')}
        </p>
        <Link href="/feed"
          className="px-5 py-2.5 bg-green-700 text-white font-bold rounded-xl text-sm hover:bg-green-800 transition-colors">
          ← {t('Back to Guide', 'ガイドへ戻る', 'গাইডে ফিরুন')}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Category tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.categories.map(c => (
            <Link key={c.slug}
              href={`/feed?${c.type === 'country' ? 'country' : 'purpose'}=${c.slug}`}
              className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white border border-slate-100 text-slate-600 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors shadow-sm">
              {c.flag} {c.name}
            </Link>
          ))}
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white border border-slate-100 text-slate-500 shadow-sm">
            {post.type === 'video' ? '🎬 ' + t('Video','動画','ভিডিও')
              : post.type === 'article' ? '📰 ' + t('Article','記事','আর্টিকেল')
              : '✍️ ' + t('Post','投稿','পোস্ট')}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-3">
          {post.title}
        </h1>

        {/* Meta */}
        <p className="text-xs text-slate-400 mb-7">
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString(undefined, { dateStyle: 'long' })
            : ''}
        </p>

        {/* ── VIDEO ───────────────────────────────────────── */}
        {post.type === 'video' && (
          <div className="mb-8">
            {!isLocked && post.youtube_id ? (
              /* Authenticated: show iframe */
              <div className="relative w-full rounded-2xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${post.youtube_id}?rel=0&modestbranding=1&color=white`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={post.title}
                />
              </div>
            ) : (
              /* Guest: thumbnail + lock overlay */
              <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
                {post.thumbnail && (
                  <img src={post.thumbnail} alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 p-6">
                  <div className="w-16 h-16 rounded-full bg-white/15 border border-white/30 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-black text-base mb-1">
                      {t('Sign in to watch', 'サインインして視聴', 'দেখতে সাইন ইন করুন')}
                    </p>
                    <p className="text-white/70 text-xs">
                      {t('Free account required', '無料登録が必要です', 'ফ্রি অ্যাকাউন্ট প্রয়োজন')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/auth/register"
                      className="px-4 py-2 bg-green-600 text-white text-xs font-black rounded-lg hover:bg-green-500 transition-colors">
                      {t('Join Free', '無料登録', 'ফ্রি যোগ দিন')}
                    </Link>
                    <Link href="/auth/login"
                      className="px-4 py-2 bg-white/20 text-white text-xs font-bold rounded-lg hover:bg-white/30 transition-colors border border-white/30">
                      {t('Sign In', 'サインイン', 'সাইন ইন')}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ARTICLE / TEXT: thumbnail ────────────────────── */}
        {post.type !== 'video' && post.thumbnail && (
          <div className="mb-8 rounded-2xl overflow-hidden h-64 shadow-sm">
            <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* ── CONTENT ─────────────────────────────────────── */}
        {!isLocked ? (
          /* Authenticated: full content */
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
            {post.body ? (
              <div className="rich-body" dangerouslySetInnerHTML={{ __html: post.body }} />
            ) : (
              <p className="text-slate-600 leading-relaxed">{post.excerpt}</p>
            )}
          </div>
        ) : (
          /* Guest: excerpt + lock gate */
          <div>
            {/* Excerpt — always visible */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-0">
              <p className="text-slate-700 leading-relaxed text-[15px]">{post.excerpt}</p>
            </div>

            {/* Gradient fade into gate */}
            <div className="relative">
              {/* Faded continuation hint */}
              <div className="px-6 py-5 bg-white border-x border-slate-100 select-none pointer-events-none">
                <div className="space-y-2.5 opacity-25 blur-[3px]">
                  <div className="h-3 bg-slate-400 rounded w-full" />
                  <div className="h-3 bg-slate-400 rounded w-11/12" />
                  <div className="h-3 bg-slate-400 rounded w-4/5" />
                  <div className="h-3 bg-slate-400 rounded w-full" />
                  <div className="h-3 bg-slate-400 rounded w-3/4" />
                </div>
              </div>

              {/* Gate overlay */}
              <div className="bg-gradient-to-b from-white/0 via-white/80 to-white absolute inset-0 pointer-events-none" />
            </div>

            {/* CTA card */}
            <div className="bg-gradient-to-br from-green-800 to-green-700 rounded-b-2xl px-6 py-8 text-center shadow-sm border-x border-b border-green-900/20">
              <div className="w-10 h-10 rounded-full bg-green-600/50 border border-green-500/40 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="font-black text-white text-lg mb-1">
                {t('Continue reading for free', '無料で続きを読む', 'ফ্রিতে পড়া চালিয়ে যান')}
              </p>
              <p className="text-green-200 text-sm mb-5">
                {t(
                  'Create a free Tensai account to read full articles, watch videos, and track your study abroad journey.',
                  '無料登録で記事全文・動画の閲覧と留学サポートをご利用いただけます。',
                  'ফ্রি Tensai অ্যাকাউন্ট তৈরি করুন — সব কনটেন্ট পড়ুন এবং বিদেশে পড়ার সুযোগ নিন।'
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

        {/* ── Back + Footer ────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <Link href="/feed"
            className="text-sm font-bold text-slate-500 hover:text-green-700 transition-colors flex items-center gap-1">
            ← {t('Back to Guide', 'ガイドへ戻る', 'গাইডে ফিরুন')}
          </Link>
          {!user && (
            <Link href="/auth/register"
              className="text-xs font-bold text-green-700 hover:underline">
              {t('Join free to unlock all content →', '無料登録で全コンテンツを解放 →', 'ফ্রিতে যোগ দিন →')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
