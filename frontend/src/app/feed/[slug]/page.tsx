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
  youtube_id: string | null; published_at: string; categories: Category[]; locked: boolean;
}

/* ── Navbar ──────────────────────────────────────────────────── */
function PostNav({ title, user, t }: {
  title?: string;
  user: unknown;
  t: (a: string, b: string, c: string) => string;
}) {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Left: logo > guide > title */}
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-green-700 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm">T</span>
            </div>
          </Link>
          <svg className="w-3 h-3 text-slate-300 shrink-0" fill="none" viewBox="0 0 8 12">
            <path d="M1 1l6 5-6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <Link href="/feed" className="text-sm font-bold text-green-700 hover:underline shrink-0">
            {t('Guide','ガイド','গাইড')}
          </Link>
          {title && (
            <>
              <svg className="w-3 h-3 text-slate-300 shrink-0 hidden sm:block" fill="none" viewBox="0 0 8 12">
                <path d="M1 1l6 5-6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="text-xs text-slate-500 truncate hidden sm:block">{title}</span>
            </>
          )}
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
export default function FeedPostPage() {
  return <Suspense><PostInner /></Suspense>;
}

function PostInner() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLang();
  const { user }  = useAuthStore();
  const t = (en: string, ja: string, bn: string) => lang === 'ja' ? ja : lang === 'bn' ? bn : en;

  const { data: post, isLoading, isError } = useQuery<Post>({
    queryKey: ['feed-post', slug],
    queryFn: () => api.get(`/feed/${slug}`).then(r => r.data),
    staleTime: 60_000,
  });

  const isLocked = !!post?.locked && !user;

  /* ── Loading ─────────────────────────────────────────────── */
  if (isLoading) return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <PostNav user={user} t={t} />
      <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="flex gap-2">
          <div className="h-6 bg-slate-200 rounded-full w-16" />
          <div className="h-6 bg-slate-200 rounded-full w-20" />
        </div>
        <div className="h-8 bg-slate-200 rounded w-5/6" />
        <div className="h-5 bg-slate-200 rounded w-3/5" />
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-52 sm:h-72 bg-slate-200 rounded-2xl" />
        <div className="bg-white rounded-2xl p-6 space-y-3">
          {[...Array(6)].map((_,i) => (
            <div key={i} className="h-3 bg-slate-100 rounded" style={{width:`${90-i*8}%`}} />
          ))}
        </div>
      </div>
    </div>
  );

  /* ── Error ───────────────────────────────────────────────── */
  if (isError || !post) return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <PostNav user={user} t={t} />
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-5">🔍</div>
        <p className="font-black text-slate-800 text-2xl mb-2">
          {t('Post not found','記事が見つかりません','পোস্ট পাওয়া যায়নি')}
        </p>
        <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
          {t('This link may be broken or the post was removed.',
            'このリンクは無効か、記事が削除された可能性があります。',
            'এই লিংক ভুল বা পোস্টটি সরানো হয়েছে।')}
        </p>
        <Link href="/feed"
          className="inline-flex items-center gap-2 h-11 px-6 bg-green-700 text-white font-bold rounded-xl text-sm hover:bg-green-800 transition-colors">
          ← {t('Back to Guide','ガイドへ戻る','গাইডে ফিরুন')}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <PostNav title={post.title} user={user} t={t} />

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">

        {/* ── Category + type tags ─────────────────────────── */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.categories.map(c => (
            <Link key={c.slug}
              href={`/feed?${c.type === 'country' ? 'country' : 'purpose'}=${c.slug}`}
              className="inline-flex items-center h-7 px-3 rounded-full bg-white border border-slate-150 text-slate-600 text-xs font-bold
                hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors shadow-sm active:scale-95">
              {c.flag} {c.name}
            </Link>
          ))}
          <span className="inline-flex items-center h-7 px-3 rounded-full bg-white border border-slate-150 text-slate-500 text-xs font-bold shadow-sm">
            {post.type === 'video'   ? `🎬 ${t('Video','動画','ভিডিও')}`
            : post.type === 'article' ? `📰 ${t('Article','記事','আর্টিকেল')}`
            :                           `✍️ ${t('Post','投稿','পোস্ট')}`}
          </span>
        </div>

        {/* ── Title ───────────────────────────────────────── */}
        <h1 className="text-2xl sm:text-[1.85rem] font-black text-slate-900 leading-tight mb-2">
          {post.title}
        </h1>

        {/* ── Date ────────────────────────────────────────── */}
        <p className="text-xs text-slate-400 mb-6 sm:mb-8">
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString(undefined,{dateStyle:'long'})
            : ''}
        </p>

        {/* ── VIDEO ───────────────────────────────────────── */}
        {post.type === 'video' && (
          <div className="mb-7 sm:mb-9">
            {!isLocked && post.youtube_id ? (
              /* Authenticated — real embed */
              <div className="relative w-full rounded-2xl overflow-hidden shadow-lg bg-black"
                style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${post.youtube_id}?rel=0&modestbranding=1&color=white`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  loading="lazy"
                  title={post.title}
                />
              </div>
            ) : (
              /* Guest — locked thumbnail */
              <div className="relative w-full rounded-2xl overflow-hidden shadow-lg"
                style={{ paddingBottom: '56.25%' }}>
                {post.thumbnail
                  ? <img src={post.thumbnail} alt={post.title}
                      className="absolute inset-0 w-full h-full object-cover" />
                  : <div className="absolute inset-0 bg-slate-800" />
                }
                <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-[2px]
                  flex flex-col items-center justify-center gap-4 p-5 sm:p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/25
                    flex items-center justify-center">
                    <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-black text-base sm:text-lg mb-1">
                      {t('Sign in to watch this video','サインインして視聴','ভিডিও দেখতে সাইন ইন করুন')}
                    </p>
                    <p className="text-white/60 text-xs sm:text-sm">
                      {t('A free Tensai account is required','無料登録が必要です','ফ্রি অ্যাকাউন্ট প্রয়োজন')}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                    <Link href="/auth/register"
                      className="h-10 sm:h-9 px-6 bg-green-600 text-white text-sm font-black rounded-xl
                        hover:bg-green-500 transition-colors flex items-center justify-center">
                      {t('Join Free','無料登録','ফ্রি যোগ দিন')}
                    </Link>
                    <Link href="/auth/login"
                      className="h-10 sm:h-9 px-6 bg-white/15 text-white text-sm font-bold rounded-xl
                        border border-white/25 hover:bg-white/25 transition-colors flex items-center justify-center">
                      {t('Sign In','サインイン','সাইন ইন')}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Article/text thumbnail ───────────────────────── */}
        {post.type !== 'video' && post.thumbnail && (
          <div className="mb-7 sm:mb-9 rounded-2xl overflow-hidden shadow-sm" style={{ height: 'clamp(180px, 45vw, 280px)' }}>
            <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* ── CONTENT ─────────────────────────────────────── */}
        {!isLocked ? (
          /* Authenticated — full content */
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-8">
            {post.body
              ? <div className="rich-body" dangerouslySetInnerHTML={{ __html: post.body }} />
              : <p className="text-slate-600 leading-relaxed text-[15px]">{post.excerpt}</p>
            }
          </div>
        ) : (
          /* Guest — excerpt + gate */
          <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">

            {/* Visible excerpt */}
            <div className="bg-white px-5 sm:px-8 pt-6 sm:pt-8 pb-4">
              <p className="text-slate-700 leading-[1.8] text-[15px] sm:text-base">
                {post.excerpt}
              </p>
            </div>

            {/* Blurred "more content" hint */}
            <div className="relative bg-white px-5 sm:px-8 pb-2 select-none pointer-events-none overflow-hidden">
              <div className="space-y-2.5 opacity-[0.18] blur-[4px]">
                {[100,95,88,100,78,92,60].map((w,i) => (
                  <div key={i} className="h-3.5 bg-slate-500 rounded" style={{width:`${w}%`}} />
                ))}
              </div>
              {/* fade overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/75 to-white" />
            </div>

            {/* CTA gate */}
            <div className="bg-gradient-to-br from-[#0d2414] to-green-800 px-5 sm:px-10 py-8 sm:py-10 text-center">
              <div className="w-11 h-11 rounded-full bg-green-700/60 border border-green-500/30
                flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <p className="font-black text-white text-xl sm:text-2xl mb-2">
                {t('Continue reading — it\'s free','無料で続きを読む','ফ্রিতে পড়া চালিয়ে যান')}
              </p>
              <p className="text-green-200 text-sm sm:text-base mb-6 max-w-sm mx-auto leading-relaxed">
                {t(
                  'Sign up for a free Tensai account to read full articles, watch videos, and start your study abroad journey.',
                  '無料登録で記事全文・動画・留学サポートをすべてご利用いただけます。',
                  'ফ্রি Tensai অ্যাকাউন্ট তৈরি করুন — সব কনটেন্ট পড়ুন এবং বিদেশে পড়ার যাত্রা শুরু করুন।'
                )}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link href="/auth/register"
                  className="h-12 sm:h-11 px-8 bg-white text-green-800 font-black rounded-xl text-sm
                    hover:bg-green-50 transition-colors flex items-center justify-center">
                  {t('Create Free Account','無料で登録','ফ্রি অ্যাকাউন্ট তৈরি')}
                </Link>
                <Link href="/auth/login"
                  className="h-12 sm:h-11 px-8 bg-green-900/50 text-white font-bold rounded-xl text-sm
                    border border-green-600 hover:bg-green-900/70 transition-colors flex items-center justify-center">
                  {t('Sign In','サインイン','সাইন ইন')}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom nav ───────────────────────────────────── */}
        <div className="mt-8 sm:mt-10 pt-5 border-t border-slate-200
          flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Link href="/feed"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500
              hover:text-green-700 transition-colors active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            {t('Back to Guide','ガイドへ戻る','গাইডে ফিরুন')}
          </Link>
          {!user && (
            <Link href="/auth/register"
              className="text-sm font-bold text-green-700 hover:underline active:opacity-70">
              {t('Join free → unlock all content','無料登録で全コンテンツを解放','ফ্রিতে যোগ দিন → সব কনটেন্ট আনলক')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
