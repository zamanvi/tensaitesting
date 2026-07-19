'use client';
import { useQuery } from '@tanstack/react-query';
import { Suspense, useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';

/* ── Reading progress bar ────────────────────────────────────── */
function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el  = document.documentElement;
      const top = el.scrollTop || document.body.scrollTop;
      const h   = el.scrollHeight - el.clientHeight;
      setPct(h > 0 ? Math.min(100, (top / h) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-transparent pointer-events-none">
      <div className="h-full bg-green-500 transition-none shadow-[0_0_8px_rgba(34,197,94,0.5)]"
        style={{ width: `${pct}%` }} />
    </div>
  );
}

function readTime(body: string | undefined, excerpt: string): string {
  const text  = ((body ?? '') + ' ' + excerpt).replace(/<[^>]+>/g, ' ').trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const mins  = Math.max(2, Math.round(words / 180));
  return `${mins} min read`;
}

/* ── Back to top ─────────────────────────────────────────────── */
function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const check = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, []);
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={`fixed bottom-6 right-5 sm:right-7 z-50 w-11 h-11 rounded-2xl bg-green-700 text-white
        shadow-[0_4px_16px_rgba(21,128,61,0.35)] hover:bg-green-600 hover:shadow-[0_6px_20px_rgba(21,128,61,0.45)]
        flex items-center justify-center transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7"/>
      </svg>
    </button>
  );
}

interface Category { name: string; slug: string; type: string; flag: string; color: string; }
interface Post {
  id: number; title: string; slug: string; type: string;
  excerpt: string; body?: string; thumbnail: string | null;
  youtube_id: string | null; published_at: string; categories: Category[];
  locked: boolean; is_premium: boolean;
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

/* ── Share bar ───────────────────────────────────────────────── */
function ShareBar({ title, excerpt, thumbnail, t }: {
  title: string;
  excerpt: string;
  thumbnail: string | null;
  t: (a: string, b: string, c: string) => string;
}) {
  const [copied, setCopied] = useState(false);

  const getUrl = () => typeof window !== 'undefined' ? window.location.href : '';

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(getUrl()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, []);

  const encoded  = typeof window !== 'undefined' ? encodeURIComponent(getUrl()) : '';
  const encodedT = encodeURIComponent(title);

  const buttons = [
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodedT}%20${encoded}`,
      bg: 'bg-[#f0fdf4] hover:bg-[#dcfce7]',
      border: 'border-[#bbf7d0]',
      text: 'text-[#15803d]',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
    },
    {
      label: 'Messenger',
      href: `https://www.facebook.com/dialog/send?link=${encoded}&app_id=291494419107518&redirect_uri=${encoded}`,
      bg: 'bg-[#eff6ff] hover:bg-[#dbeafe]',
      border: 'border-[#bfdbfe]',
      text: 'text-[#0099ff]',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.653V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
        </svg>
      ),
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      bg: 'bg-[#eff6ff] hover:bg-[#dbeafe]',
      border: 'border-[#bfdbfe]',
      text: 'text-[#1d4ed8]',
      icon: (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodedT}&url=${encoded}`,
      bg: 'bg-slate-900 hover:bg-slate-800',
      border: 'border-slate-800',
      text: 'text-white',
      icon: (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      label: 'Pinterest',
      href: `https://pinterest.com/pin/create/button/?url=${encoded}&media=${encodeURIComponent(thumbnail ?? '')}&description=${encodedT}`,
      bg: 'bg-[#fff0f0] hover:bg-[#ffe4e4]',
      border: 'border-[#fecaca]',
      text: 'text-[#e60023]',
      icon: (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="mt-8 rounded-2xl overflow-hidden border border-slate-100 shadow-[0_1px_6px_rgba(15,23,42,0.07)] bg-white">

      {/* Link preview card */}
      <div className="flex items-stretch border-b border-slate-100">
        {thumbnail ? (
          <div className="w-28 sm:w-36 shrink-0 bg-slate-100 overflow-hidden">
            <img src={thumbnail} alt={title}
              className="w-full h-full object-cover"
              style={{ aspectRatio: '16/9', minHeight: '80px' }}
              loading="lazy" decoding="async" />
          </div>
        ) : (
          <div className="w-28 sm:w-36 shrink-0 bg-gradient-to-br from-[#0b1e11] to-[#0f2d1a] flex items-center justify-center">
            <div className="w-8 h-8 rounded-xl bg-green-900/60 border border-green-700/40 flex items-center justify-center">
              <span className="text-green-400 font-black text-sm">T</span>
            </div>
          </div>
        )}
        <div className="flex flex-col justify-center px-4 py-3 min-w-0">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">tensai.study</p>
          <p className="text-sm font-black text-slate-800 leading-snug line-clamp-2 mb-1">{title}</p>
          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 hidden sm:block">
            {excerpt.slice(0, 100)}{excerpt.length > 100 ? '…' : ''}
          </p>
        </div>
      </div>

      {/* Share label + buttons */}
      <div className="px-4 py-3.5">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">
          {t('Share this article','この記事をシェア','এই আর্টিকেল শেয়ার করুন')}
        </p>
        <div className="flex items-center gap-2 flex-wrap">

          {/* Copy link */}
          <button onClick={copyLink}
            className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-bold border transition-all duration-150
              ${copied
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'}`}>
            {copied ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
            )}
            {copied
              ? t('Copied!','コピー完了','কপি হয়েছে')
              : t('Copy link','コピー','লিংক কপি')}
          </button>

          <div className="w-px h-5 bg-slate-200 mx-0.5" />

          {/* Platform buttons */}
          {buttons.map(btn => (
            <a key={btn.label}
              href={btn.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-bold border transition-colors duration-150 ${btn.bg} ${btn.border} ${btn.text}`}>
              {btn.icon}
              <span className="hidden sm:inline">{btn.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Related posts ───────────────────────────────────────────── */
function RelatedPosts({ slug, t }: {
  slug: string;
  t: (a: string, b: string, c: string) => string;
}) {
  const { data: posts } = useQuery<Post[]>({
    queryKey: ['related', slug],
    queryFn: () => api.get(`/feed/${slug}/related`).then(r => r.data),
    staleTime: 300_000,
  });

  if (!posts || posts.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
        {t('More from the Guide','ガイドのその他','গাইড থেকে আরও')}
      </h2>
      <div className="grid gap-3">
        {posts.map(p => (
          <Link key={p.slug} href={`/feed/${p.slug}`}
            className="group flex gap-3 bg-white rounded-2xl border border-slate-100
              shadow-[0_1px_4px_rgba(15,23,42,0.05)] p-3 hover:border-green-200
              hover:shadow-[0_2px_12px_rgba(21,128,61,0.10)] transition-all duration-150">
            {p.thumbnail ? (
              <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                <img src={p.thumbnail} alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy" decoding="async" />
              </div>
            ) : (
              <div className="w-20 h-16 rounded-xl shrink-0 bg-gradient-to-br from-[#0b1e11] to-[#0f2d1a] flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
            )}
            <div className="min-w-0 flex flex-col justify-center gap-1">
              <p className="text-[0.82rem] font-black text-slate-800 leading-snug line-clamp-2
                group-hover:text-green-800 transition-colors">
                {p.title}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {p.categories.slice(0, 2).map(c => (
                  <span key={c.slug}
                    className="text-[10px] font-bold text-slate-400">{c.flag} {c.name}</span>
                ))}
                {p.is_premium && (
                  <span className="text-[10px] font-black text-amber-500">★ Premium</span>
                )}
              </div>
            </div>
            <div className="flex items-center shrink-0 ml-auto pl-1">
              <svg className="w-4 h-4 text-slate-300 group-hover:text-green-500 group-hover:translate-x-0.5 transition-all"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Page export ─────────────────────────────────────────────── */
export default function PostClient() {
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

  const isLocked = !!post?.is_premium && !user;

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

  const rt = readTime(post.body, post.excerpt);

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <ReadingProgress />
      <BackToTop />
      <PostNav title={post.title} user={user} t={t} />

      <div className="max-w-3xl mx-auto px-4 py-7 sm:py-9">

        {/* ── NEWSPAPER HEADER (all non-video types) ──────────── */}
        {post.type !== 'video' && (
          <div className="mb-6 sm:mb-8">

            {/* Category row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-4">
              {post.categories.map((c, i) => (
                <Link key={c.slug}
                  href={`/feed?${c.type === 'country' ? 'country' : 'purpose'}=${c.slug}`}
                  className="text-[11px] font-black tracking-widest uppercase transition-colors"
                  style={{ color: c.type === 'country' ? '#16a34a' : '#0284c7' }}>
                  {i > 0 && <span className="mr-3 text-slate-300">·</span>}
                  {c.flag} {c.name}
                </Link>
              ))}
              {post.is_premium && (
                <span className="inline-flex items-center gap-1 text-[11px] font-black tracking-widest uppercase text-amber-500">
                  ★ {t('Premium','プレミアム','প্রিমিয়াম')}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-[1.85rem] sm:text-[2.4rem] font-black text-slate-900 leading-[1.18] tracking-tight mb-4">
              {post.title}
            </h1>

            {/* Excerpt as sub-headline */}
            <p className="text-base sm:text-[1.05rem] text-slate-500 leading-[1.7] mb-5 border-l-4 border-green-500 pl-4">
              {post.excerpt.slice(0, 180)}{post.excerpt.length > 180 ? '…' : ''}
            </p>

            {/* Meta row: date + read time + divider */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium pb-5 border-b border-slate-200">
              {post.published_at && (
                <span>{new Date(post.published_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              )}
              <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {rt}
              </span>
            </div>

            {/* Feature image */}
            {post.thumbnail && (
              <div className="mt-5 mb-1 rounded-xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.10)] bg-slate-100">
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  loading="eager"
                  decoding="async"
                  className="w-full object-cover object-top"
                  style={{ maxHeight: '460px', display: 'block' }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── VIDEO header ─────────────────────────────────── */}
        {post.type === 'video' && (
          <>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-4">
              {post.categories.map((c, i) => (
                <Link key={c.slug}
                  href={`/feed?${c.type === 'country' ? 'country' : 'purpose'}=${c.slug}`}
                  className="text-[11px] font-black tracking-widest uppercase transition-colors"
                  style={{ color: c.type === 'country' ? '#16a34a' : '#0284c7' }}>
                  {i > 0 && <span className="mr-3 text-slate-300">·</span>}
                  {c.flag} {c.name}
                </Link>
              ))}
            </div>
            <h1 className="text-[1.85rem] sm:text-[2.4rem] font-black text-slate-900 leading-[1.18] tracking-tight mb-4">
              {post.title}
            </h1>
            <p className="text-base sm:text-[1.05rem] text-slate-500 leading-[1.7] mb-5 border-l-4 border-green-500 pl-4">
              {post.excerpt.slice(0, 180)}{post.excerpt.length > 180 ? '…' : ''}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium pb-5 mb-5 border-b border-slate-200">
              {post.published_at && (
                <span>{new Date(post.published_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              )}
            </div>
          </>
        )}

        {/* ── VIDEO embed ─────────────────────────────────── */}
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
            ) : isLocked ? (
              <div className="relative w-full rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
                style={{ paddingBottom: '56.25%' }}>
                {post.thumbnail
                  ? <img src={post.thumbnail} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
                  : <div className="absolute inset-0 bg-slate-800" />
                }
                <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-[3px] flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </div>
                    <p className="text-white font-black text-lg mb-1">{t('Premium Content','プレミアムコンテンツ','প্রিমিয়াম কনটেন্ট')}</p>
                    <p className="text-white/50 text-sm mb-5">{t('Create an account to get this content','アカウントを作成してコンテンツを入手','এই কনটেন্ট পেতে অ্যাকাউন্ট তৈরি করুন')}</p>
                    <div className="flex gap-2.5 justify-center">
                      <a href="/auth/register" className="h-9 px-5 bg-amber-500 text-white text-sm font-black rounded-xl hover:bg-amber-400 transition-colors flex items-center">{t('Join Free','無料登録','ফ্রি যোগ দিন')}</a>
                      <a href="/auth/login" className="h-9 px-5 bg-white/10 text-white text-sm font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-colors flex items-center">{t('Sign In','サインイン','সাইন ইন')}</a>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}


        {/* ── CONTENT ─────────────────────────────────────── */}
        {!isLocked ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_4px_rgba(15,23,42,0.06)] overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-green-600 via-green-500 to-emerald-400" />
            <div className="p-5 sm:p-10">
              {post.body
                ? <div className="rich-body" dangerouslySetInnerHTML={{ __html: post.body }} />
                : <p className="text-slate-600 leading-[1.9] text-base">{post.excerpt}</p>
              }
            </div>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,0.06)] border border-slate-100">
            <div className="h-[3px] bg-gradient-to-r from-amber-500 to-yellow-400" />
            <div className="bg-white px-5 sm:px-9 pt-7 sm:pt-9 pb-5">
              <p className="text-slate-700 leading-[1.9] text-base">{post.excerpt}</p>
            </div>
            <div className="relative bg-white px-5 sm:px-9 pb-2 select-none pointer-events-none overflow-hidden">
              <div className="space-y-3 opacity-[0.15] blur-[5px]">
                {[100, 94, 87, 100, 76, 91, 58].map((w, i) => (
                  <div key={i} className="h-3.5 bg-slate-600 rounded-full" style={{ width: `${w}%` }} />
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/70 to-white" />
            </div>
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-[#1a1200]" />
              <div className="absolute inset-0 opacity-[0.035]"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="relative px-5 sm:px-10 py-9 sm:py-11 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto mb-5">
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full mb-4">
                  {t('Premium Content','プレミアムコンテンツ','প্রিমিয়াম কনটেন্ট')}
                </span>
                <p className="font-black text-white text-xl sm:text-2xl mb-2.5 tracking-tight">
                  {t('Create an account to get this content','アカウントを作成してコンテンツを入手','এই কনটেন্ট পেতে অ্যাকাউন্ট তৈরি করুন')}
                </p>
                <p className="text-slate-400 text-sm mb-7 max-w-sm mx-auto leading-relaxed">
                  {t('Free to join. Unlock all premium articles and videos instantly.',
                    '無料登録でプレミアム記事・動画を即時解放。',
                    'যোগ দেওয়া বিনামূল্যে। সব প্রিমিয়াম কনটেন্ট তাৎক্ষণিক আনলক।')}
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-2.5">
                  <a href="/auth/register"
                    className="h-12 sm:h-11 px-8 bg-amber-500 text-white font-black rounded-xl text-sm hover:bg-amber-400 transition-colors flex items-center justify-center">
                    {t('Join Free','無料で登録','ফ্রি যোগ দিন')}
                  </a>
                  <a href="/auth/login"
                    className="h-12 sm:h-11 px-8 bg-white/8 text-white font-semibold rounded-xl text-sm border border-white/12 hover:bg-white/12 transition-colors flex items-center justify-center">
                    {t('Sign In','サインイン','সাইন ইন')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Related posts ────────────────────────────────── */}
        <RelatedPosts slug={slug} t={t} />

        {/* ── Share ────────────────────────────────────────── */}
        <ShareBar title={post.title} excerpt={post.excerpt} thumbnail={post.thumbnail} t={t} />

        {/* ── Bottom nav ───────────────────────────────────── */}
        <div className="mt-6 pt-5 border-t border-slate-200
          flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Link href="/feed"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400
              hover:text-green-700 transition-colors active:scale-95 group">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            {t('Back to Guide','ガイドへ戻る','গাইডে ফিরুন')}
          </Link>
        </div>
      </div>
    </div>
  );
}
