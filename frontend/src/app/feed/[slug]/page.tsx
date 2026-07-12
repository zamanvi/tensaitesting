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

function catChip(c: Category) {
  if (c.type === 'country') return 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-200 hover:text-emerald-800';
  if (c.type === 'purpose') return 'bg-violet-50 border-violet-100 text-violet-700 hover:bg-violet-100 hover:border-violet-200 hover:text-violet-800';
  return 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 hover:border-slate-200';
}

/* ── Navbar ──────────────────────────────────────────────────── */
function PostNav({ title, user, t }: {
  title?: string;
  user: unknown;
  t: (a: string, b: string, c: string) => string;
}) {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-green-700 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm">T</span>
            </div>
          </Link>
          <svg className="w-3 h-3 text-slate-300 shrink-0" fill="none" viewBox="0 0 8 12">
            <path d="M1 1l6 5-6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <Link href="/feed" className="text-sm font-bold text-green-700 hover:text-green-800 transition-colors shrink-0">
            {t('Guide','ガイド','গাইড')}
          </Link>
          {title && (
            <>
              <svg className="w-3 h-3 text-slate-200 shrink-0 hidden sm:block" fill="none" viewBox="0 0 8 12">
                <path d="M1 1l6 5-6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="text-xs text-slate-400 truncate hidden sm:block">{title}</span>
            </>
          )}
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
    <div className="min-h-screen bg-[#f4f6f9]">
      <PostNav user={user} t={t} />
      <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="flex gap-2">
          <div className="h-6 bg-slate-200 rounded-full w-20" />
          <div className="h-6 bg-slate-200 rounded-full w-16" />
        </div>
        <div className="h-9 bg-slate-200 rounded-lg w-5/6" />
        <div className="h-9 bg-slate-200 rounded-lg w-2/3" />
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-56 sm:h-72 bg-slate-200 rounded-2xl" />
        <div className="bg-white rounded-2xl p-6 sm:p-8 space-y-3.5">
          {[...Array(7)].map((_,i) => (
            <div key={i} className="h-3 bg-slate-100 rounded" style={{width:`${95-i*7}%`}} />
          ))}
        </div>
      </div>
    </div>
  );

  /* ── Error ───────────────────────────────────────────────── */
  if (isError || !post) return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <PostNav user={user} t={t} />
      <div className="max-w-3xl mx-auto px-4 py-28 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p className="font-black text-slate-800 text-2xl mb-2 tracking-tight">
          {t('Post not found','記事が見つかりません','পোস্ট পাওয়া যায়নি')}
        </p>
        <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
          {t('This link may be broken or the post was removed.',
            'このリンクは無効か、記事が削除された可能性があります。',
            'এই লিংক ভুল বা পোস্টটি সরানো হয়েছে।')}
        </p>
        <Link href="/feed"
          className="inline-flex items-center gap-2 h-11 px-6 bg-green-700 text-white font-bold rounded-xl text-sm hover:bg-green-800 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          {t('Back to Guide','ガイドへ戻る','গাইডে ফিরুন')}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <PostNav title={post.title} user={user} t={t} />

      <div className="max-w-3xl mx-auto px-4 py-7 sm:py-9">

        {/* ── Category + type tags ─────────────────────────── */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {post.categories.map(c => (
            <Link key={c.slug}
              href={`/feed?${c.type === 'country' ? 'country' : 'purpose'}=${c.slug}`}
              className={`inline-flex items-center h-7 px-3 rounded-full border text-xs font-bold transition-colors duration-150 active:scale-95 ${catChip(c)}`}>
              {c.flag} {c.name}
            </Link>
          ))}
          <span className="inline-flex items-center h-7 px-3 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
            {post.type === 'video'   ? `🎬 ${t('Video','動画','ভিডিও')}`
            : post.type === 'article' ? `📰 ${t('Article','記事','আর্টিকেল')}`
            :                           `✍️ ${t('Post','投稿','পোস্ট')}`}
          </span>
        </div>

        {/* ── Title ───────────────────────────────────────── */}
        <h1 className="text-[1.75rem] sm:text-[2.1rem] font-black text-slate-900 leading-[1.15] tracking-tight mb-3">
          {post.title}
        </h1>

        {/* ── Date ────────────────────────────────────────── */}
        <p className="text-xs text-slate-400 font-medium mb-7 sm:mb-9">
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString(undefined, { dateStyle: 'long' })
            : ''}
        </p>

        {/* ── VIDEO ───────────────────────────────────────── */}
        {post.type === 'video' && (
          <div className="mb-7 sm:mb-9">
            {!isLocked && post.youtube_id ? (
              <div className="relative w-full rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.15)] bg-black"
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
              <div className="relative w-full rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
                style={{ paddingBottom: '56.25%' }}>
                {post.thumbnail
                  ? <img src={post.thumbnail} alt={post.title}
                      className="absolute inset-0 w-full h-full object-cover" />
                  : <div className="absolute inset-0 bg-slate-800" />
                }
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[3px]
                  flex flex-col items-center justify-center gap-5 p-5 sm:p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20
                    flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-black text-lg sm:text-xl mb-1.5 tracking-tight">
                      {t('Sign in to watch','サインインして視聴','দেখতে সাইন ইন করুন')}
                    </p>
                    <p className="text-white/50 text-xs sm:text-sm">
                      {t('Free Tensai account required','無料登録が必要です','ফ্রি অ্যাকাউন্ট প্রয়োজন')}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                    <Link href="/auth/register"
                      className="h-11 sm:h-9 px-7 bg-green-600 text-white text-sm font-black rounded-xl
                        hover:bg-green-500 transition-colors flex items-center justify-center">
                      {t('Join Free','無料登録','ফ্রি যোগ দিন')}
                    </Link>
                    <Link href="/auth/login"
                      className="h-11 sm:h-9 px-7 bg-white/10 text-white text-sm font-semibold rounded-xl
                        border border-white/20 hover:bg-white/20 transition-colors flex items-center justify-center">
                      {t('Sign In','サインイン','সাইন ইন')}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Article thumbnail ────────────────────────────── */}
        {post.type !== 'video' && post.thumbnail && (
          <div className="mb-7 sm:mb-9 rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
            style={{ height: 'clamp(180px, 45vw, 280px)' }}>
            <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* ── CONTENT ─────────────────────────────────────── */}
        {!isLocked ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_4px_rgba(15,23,42,0.06)] p-5 sm:p-9">
            {post.body
              ? <div className="rich-body" dangerouslySetInnerHTML={{ __html: post.body }} />
              : <p className="text-slate-600 leading-[1.8] text-[15px]">{post.excerpt}</p>
            }
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,0.06)] border border-slate-100">

            {/* Visible excerpt */}
            <div className="bg-white px-5 sm:px-9 pt-7 sm:pt-9 pb-5">
              <p className="text-slate-700 leading-[1.85] text-[15px] sm:text-base">
                {post.excerpt}
              </p>
            </div>

            {/* Blurred continuation hint */}
            <div className="relative bg-white px-5 sm:px-9 pb-2 select-none pointer-events-none overflow-hidden">
              <div className="space-y-3 opacity-[0.15] blur-[5px]">
                {[100, 94, 87, 100, 76, 91, 58].map((w, i) => (
                  <div key={i} className="h-3.5 bg-slate-600 rounded-full" style={{ width: `${w}%` }} />
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/70 to-white" />
            </div>

            {/* CTA gate */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-[#0b1e11]" />
              <div className="absolute inset-0 opacity-[0.035]"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="relative px-5 sm:px-10 py-9 sm:py-11 text-center">
                <div className="w-11 h-11 rounded-2xl bg-green-900/60 border border-green-700/30
                  flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <p className="font-black text-white text-xl sm:text-2xl mb-2.5 tracking-tight">
                  {t('Continue reading — it\'s free','無料で続きを読む','ফ্রিতে পড়া চালিয়ে যান')}
                </p>
                <p className="text-slate-400 text-sm sm:text-[0.9rem] mb-7 max-w-sm mx-auto leading-relaxed">
                  {t(
                    'Create a free account to unlock full articles, watch videos, and start your study abroad journey.',
                    '無料登録で記事全文・動画・留学サポートをすべてご利用いただけます。',
                    'ফ্রি অ্যাকাউন্টে সব কনটেন্ট পড়ুন এবং বিদেশে পড়ার যাত্রা শুরু করুন।'
                  )}
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-2.5">
                  <Link href="/auth/register"
                    className="h-12 sm:h-11 px-8 bg-white text-slate-900 font-black rounded-xl text-sm
                      hover:bg-slate-100 transition-colors flex items-center justify-center">
                    {t('Create Free Account','無料で登録','ফ্রি অ্যাকাউন্ট তৈরি')}
                  </Link>
                  <Link href="/auth/login"
                    className="h-12 sm:h-11 px-8 bg-white/8 text-white font-semibold rounded-xl text-sm
                      border border-white/12 hover:bg-white/12 transition-colors flex items-center justify-center">
                    {t('Sign In','サインイン','সাইন ইন')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom nav ───────────────────────────────────── */}
        <div className="mt-8 sm:mt-10 pt-5 border-t border-slate-200
          flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Link href="/feed"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400
              hover:text-green-700 transition-colors active:scale-95 group">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            {t('Back to Guide','ガイドへ戻る','গাইডে ফিরুন')}
          </Link>
          {!user && (
            <Link href="/auth/register"
              className="text-sm font-bold text-green-700 hover:text-green-800 hover:underline transition-colors active:opacity-70">
              {t('Start free — unlock everything →','無料登録で全コンテンツを解放 →','ফ্রিতে শুরু করুন — সব আনলক করুন →')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
