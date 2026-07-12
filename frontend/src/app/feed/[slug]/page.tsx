'use client';
import { useQuery } from '@tanstack/react-query';
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
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLang();
  const { user } = useAuthStore();
  const t = (en: string, ja: string, bn: string) => lang === 'ja' ? ja : lang === 'bn' ? bn : en;

  const { data: post, isLoading, isError } = useQuery<Post>({
    queryKey: ['feed-post', slug],
    queryFn: () => api.get(`/feed/${slug}`).then(r => r.data),
    staleTime: 60_000,
  });

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-6 bg-slate-100 rounded w-1/3" />
        <div className="h-8 bg-slate-100 rounded w-4/5" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-3 bg-slate-100 rounded" />)}
        </div>
      </div>
    </div>
  );

  if (isError || !post) return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-400">
        <div className="text-5xl mb-3">🔍</div>
        <p className="font-semibold">{t('Post not found.', '記事が見つかりません。', 'পোস্ট পাওয়া যায়নি।')}</p>
        <Link href="/feed" className="mt-4 inline-block text-green-700 font-bold text-sm hover:underline">
          ← {t('Back to Feed', 'フィードへ', 'ফিডে ফিরুন')}
        </Link>
      </div>
    </div>
  );

  const isLocked = post.locked && !user;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Link href="/feed" className="hover:text-green-700 font-semibold transition-colors">
            {t('Feed', 'フィード', 'ফিড')}
          </Link>
          <span>/</span>
          <span className="text-slate-600 truncate max-w-xs">{post.title}</span>
        </div>

        {/* Category tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.categories.map(c => (
            <Link key={c.slug} href={`/feed?${c.type === 'country' ? 'country' : 'purpose'}=${c.slug}`}
              className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-700 transition-colors">
              {c.flag} {c.name}
            </Link>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-slate-900 leading-tight mb-3">
          {post.title}
        </h1>

        {/* Date */}
        <p className="text-xs text-slate-400 mb-6">
          {post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : ''}
        </p>

        {/* Video embed or thumbnail */}
        {post.type === 'video' && (
          <div className="mb-8">
            {!isLocked && post.youtube_id ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full rounded-2xl"
                  src={`https://www.youtube.com/embed/${post.youtube_id}?rel=0&modestbranding=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={post.title}
                />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                {post.thumbnail && (
                  <img src={post.thumbnail} alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-black text-sm">
                      {t('Sign in to watch this video', 'サインインして動画を視聴', 'ভিডিও দেখতে সাইন ইন করুন')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Thumbnail for non-video */}
        {post.type !== 'video' && post.thumbnail && (
          <div className="mb-8 rounded-2xl overflow-hidden h-64">
            <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        {!isLocked ? (
          <div>
            {post.body ? (
              <div
                className="rich-body"
                dangerouslySetInnerHTML={{ __html: post.body }}
              />
            ) : (
              <p className="text-slate-600 leading-relaxed">{post.excerpt}</p>
            )}
          </div>
        ) : (
          <div>
            {/* Excerpt visible to all */}
            <p className="text-slate-600 leading-relaxed mb-6">{post.excerpt}</p>

            {/* Lock gate */}
            <div className="relative rounded-2xl border border-slate-200 overflow-hidden">
              {/* Blurred preview */}
              <div className="p-6 blur-sm select-none pointer-events-none opacity-60">
                <p className="text-slate-600 text-sm leading-relaxed">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur reprehenderit
                  quasi cumque provident mollitia laboriosam nisi nulla earum illum ratione officiis
                  voluptates eum exercitationem, numquam rem quis at sapiente quaerat.
                </p>
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-white flex flex-col items-center justify-end pb-8 gap-3">
                <div className="text-center">
                  <p className="font-black text-slate-900 text-lg">
                    {t('Unlock Full Content', '全文を読む', 'সম্পূর্ণ কনটেন্ট দেখুন')}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {t('Sign in to read articles, watch videos, and more.', 'サインインして記事・動画を閲覧できます。', 'সাইন ইন করুন এবং সব কনটেন্ট পড়ুন।')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href="/auth/login"
                    className="px-5 py-2.5 bg-green-700 text-white font-black rounded-xl text-sm hover:bg-green-800 transition-colors">
                    {t('Sign In', 'サインイン', 'সাইন ইন')}
                  </Link>
                  <Link href="/auth/register"
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:border-green-300 transition-colors">
                    {t('Create Account', '新規登録', 'অ্যাকাউন্ট তৈরি')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mt-10 pt-6 border-t border-slate-100">
          <Link href="/feed"
            className="text-sm font-bold text-slate-500 hover:text-green-700 transition-colors">
            ← {t('Back to Feed', 'フィードへ戻る', 'ফিডে ফিরুন')}
          </Link>
        </div>
      </div>
    </div>
  );
}
