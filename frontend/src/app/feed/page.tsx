'use client';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
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
  const { lang } = useLang();
  const { user } = useAuthStore();
  const t = (en: string, ja: string, bn: string) => lang === 'ja' ? ja : lang === 'bn' ? bn : en;
  const searchParams = useSearchParams();

  const [country, setCountry]   = useState('');
  const [purpose, setPurpose]   = useState('');
  const [type, setType]         = useState('');

  // Sync state from URL params (e.g. links from /feed/[slug] category tags)
  useEffect(() => {
    const c = searchParams.get('country') ?? '';
    const p = searchParams.get('purpose') ?? '';
    const tp = searchParams.get('type') ?? '';
    setCountry(c);
    setPurpose(p);
    setType(tp);
  }, [searchParams]);

  const { data: cats } = useQuery({
    queryKey: ['feed-categories'],
    queryFn: () => api.get('/feed-categories').then(r => r.data),
    staleTime: 300_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['feed', country, purpose, type],
    queryFn: () => api.get('/feed', { params: { country: country || undefined, purpose: purpose || undefined, type: type || undefined } }).then(r => r.data),
    staleTime: 60_000,
  });

  const posts: Post[] = data?.data ?? [];
  const countries: Category[] = cats?.countries ?? [];
  const purposes: Category[]  = cats?.purposes  ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            {t('Study Abroad Guide', '海外留学ガイド', 'বিদেশ পড়াশোনা গাইড')}
          </h1>
          <p className="text-slate-500 text-sm">
            {t('Curated content to help you plan your journey abroad.', '海外留学の計画に役立つコンテンツ。', 'বিদেশে যাওয়ার পরিকল্পনায় সাহায্য করার জন্য বাছাই করা কনটেন্ট।')}
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 mb-6 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 self-center mr-1">
            {t('Filter:', 'フィルター:', 'ফিল্টার:')}
          </span>

          {/* Country pills */}
          {countries.map(c => (
            <button key={c.slug}
              onClick={() => setCountry(country === c.slug ? '' : c.slug)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                ${country === c.slug
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-green-300'}`}>
              {c.flag} {c.name}
            </button>
          ))}

          <div className="w-px h-6 bg-slate-200 self-center mx-1" />

          {/* Purpose pills */}
          {purposes.map(p => (
            <button key={p.slug}
              onClick={() => setPurpose(purpose === p.slug ? '' : p.slug)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                ${purpose === p.slug
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
              {p.flag} {p.name}
            </button>
          ))}

          <div className="w-px h-6 bg-slate-200 self-center mx-1" />

          {/* Type pills */}
          {[['video','🎬','Video'],['article','📰','Article'],['text','✍️','Post']].map(([v,e,l]) => (
            <button key={v}
              onClick={() => setType(type === v ? '' : v)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                ${type === v
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
              {e} {l}
            </button>
          ))}

          {(country || purpose || type) && (
            <button onClick={() => { setCountry(''); setPurpose(''); setType(''); }}
              className="ml-auto text-xs text-slate-400 hover:text-red-500 font-semibold">
              ✕ {t('Clear', 'クリア', 'মুছুন')}
            </button>
          )}
        </div>

        {/* Posts grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                <div className="h-44 bg-slate-100" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 rounded" />
                  <div className="h-3 bg-slate-100 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-semibold">{t('No posts found.', '投稿が見つかりません。', 'কোনো পোস্ট পাওয়া যায়নি।')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} user={user} t={t} />
            ))}
          </div>
        )}

        {/* Login nudge for guests */}
        {!user && posts.length > 0 && (
          <div className="mt-10 p-6 bg-gradient-to-r from-green-700 to-emerald-600 rounded-2xl text-center text-white shadow-lg">
            <p className="font-black text-lg mb-1">
              {t('Get personalized content', 'パーソナライズされたコンテンツを見る', 'আপনার জন্য কাস্টম কনটেন্ট পান')}
            </p>
            <p className="text-green-100 text-sm mb-4">
              {t('Sign in to filter by your preferred country and unlock full articles.', 'サインインして記事全文を読みましょう。', 'সাইন ইন করুন এবং সম্পূর্ণ কনটেন্ট দেখুন।')}
            </p>
            <Link href="/auth/login"
              className="inline-block px-6 py-2.5 bg-white text-green-800 font-black rounded-xl text-sm hover:bg-green-50 transition-colors">
              {t('Sign In Free', '無料でサインイン', 'ফ্রি সাইন ইন')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, user, t }: {
  post: Post;
  user: unknown;
  t: (en: string, ja: string, bn: string) => string;
}) {
  const typeIcon = post.type === 'video' ? '🎬' : post.type === 'article' ? '📰' : '✍️';
  const isLocked = post.locked && !user;

  return (
    <Link href={`/feed/${post.slug}`}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:border-green-200 transition-all">

      {/* Thumbnail */}
      <div className="relative h-44 bg-slate-100 overflow-hidden">
        {post.thumbnail ? (
          <img src={post.thumbnail} alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">{typeIcon}</div>
        )}
        {post.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
              <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
        {isLocked && (
          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-[2px]">
            <div className="bg-white/90 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs font-bold text-slate-700">
                {t('Login to unlock', 'ログインで全文', 'লগইন করুন')}
              </span>
            </div>
          </div>
        )}
        {/* Type badge */}
        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {typeIcon} {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Category tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          {post.categories.slice(0, 3).map(c => (
            <span key={c.slug}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${COLOR_MAP[c.color] ?? 'bg-slate-100 text-slate-600'}`}>
              {c.flag} {c.name}
            </span>
          ))}
        </div>

        <h3 className="font-bold text-slate-900 text-sm leading-snug mb-2 group-hover:text-green-700 transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{post.excerpt}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            {post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : ''}
          </span>
          <span className="text-xs font-bold text-green-700 group-hover:underline">
            {t('Read more →', '続きを読む →', 'আরো পড়ুন →')}
          </span>
        </div>
      </div>
    </Link>
  );
}
