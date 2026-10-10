'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import SiteHeader from '@/components/shared/SiteHeader';
import RemoteImage from '@/components/shared/RemoteImage';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://tensai-production-3af6.up.railway.app/api';

interface GalleryItem {
  id: number;
  title: string;
  description: string | null;
  content?: string | null;
  image_url: string;
  extra_image_urls?: string[];
  category: string;
  branch: { name: string; slug: string } | null;
}

interface BranchOption {
  id: number;
  name: string;
  slug: string;
}

const PLACEHOLDER_CARDS = [
  { emoji: '🎓', category: 'students',    labelEn: 'Student Journeys',   labelJa: '学生の旅',              labelBn: 'শিক্ষার্থীর যাত্রা'   },
  { emoji: '🇯🇵', category: 'japan',       labelEn: 'Japan Placements',   labelJa: '日本進学',              labelBn: 'জাপান প্লেসমেন্ট'    },
  { emoji: '🏆', category: 'milestones',  labelEn: 'Milestones',         labelJa: 'マイルストーン',         labelBn: 'মাইলস্টোন'           },
  { emoji: '🤝', category: 'agencies',    labelEn: 'Agency Partners',    labelJa: 'エージェンシーパートナー', labelBn: 'এজেন্সি পার্টনার'    },
  { emoji: '🌏', category: 'events',      labelEn: 'Events & Community', labelJa: 'イベント & コミュニティ', labelBn: 'ইভেন্ট ও কমিউনিটি'  },
  { emoji: '📋', category: 'docs',        labelEn: 'Verified Documents', labelJa: '認証済み書類',           labelBn: 'যাচাইকৃত কাগজপত্র'   },
  { emoji: '✈️', category: 'departures',  labelEn: 'Departure Stories',  labelJa: '出発ストーリー',          labelBn: 'রওনার গল্প'          },
  { emoji: '🏫', category: 'institutes',  labelEn: 'Partner Institutes', labelJa: 'パートナー校',            labelBn: 'পার্টনার প্রতিষ্ঠান' },
];

const CATEGORIES = [
  { key: 'all',        labelEn: 'All',         labelJa: 'すべて',      labelBn: 'সব'              },
  { key: 'students',   labelEn: 'Students',    labelJa: '学生',        labelBn: 'শিক্ষার্থী'      },
  { key: 'japan',      labelEn: 'Japan',       labelJa: '日本',        labelBn: 'জাপান'           },
  { key: 'milestones', labelEn: 'Milestones',  labelJa: 'マイルストーン', labelBn: 'মাইলস্টোন'    },
  { key: 'events',     labelEn: 'Events',      labelJa: 'イベント',    labelBn: 'ইভেন্ট'         },
  { key: 'agencies',   labelEn: 'Agencies',    labelJa: 'エージェンシー', labelBn: 'এজেন্সি'      },
];

/**
 * Server snapshot (page.tsx, cached ~60s) so the grid is in the first paint. Either field
 * can be null (backend unreachable at render time) and the page then behaves as before.
 * The browser always refetches after mount, so the final data is as fresh as it ever was.
 */
export interface GalleryInitialData {
  items: GalleryItem[] | null;
  branches: BranchOption[] | null;
}

export default function GalleryPage({ initial }: { initial?: GalleryInitialData }) {
  const { t, lang } = useLang();
  const l = t.landing;
  const a = t.about;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const [items, setItems]       = useState<GalleryItem[]>(initial?.items ?? []);
  const [loading, setLoading]   = useState(!initial?.items);
  const [active, setActive]     = useState('all');
  const [branches, setBranches] = useState<BranchOption[]>(initial?.branches ?? []);
  const [activeBranch, setActiveBranch] = useState('all');
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    // A failed/odd refresh must not wipe branches we already have from the snapshot.
    fetch(`${API}/branches`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBranches(data);
        else if (!initial?.branches) setBranches([]);
      })
      .catch(() => { if (!initial?.branches) setBranches([]); });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount, like before
  }, []);

  useEffect(() => {
    if (lightbox) setLightboxImage(lightbox.image_url);
  }, [lightbox]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [lightbox]);

  useEffect(() => {
    fetch(`${API}/gallery`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
        else if (!initial?.items) setItems([]);
      })
      .catch(() => { if (!initial?.items) setItems([]); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount, like before
  }, []);

  const filtered = items
    .filter((i) => active === 'all' || i.category === active)
    .filter((i) => activeBranch === 'all' || i.branch?.slug === activeBranch);
  const hasData  = !loading && items.length > 0;

  const termsText = ja ? '利用規約'   : bn ? 'শর্তাবলী'  : 'Terms';
  const privText  = ja ? 'プライバシー' : bn ? 'প্রাইভেসি' : 'Privacy';

  return (
    <div className="min-h-screen bg-[#0d1117]">

      <SiteHeader active="gallery" />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pt-32 pb-12 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-[15%] w-[300px] h-[200px] bg-cyan-500/6 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
            {ja ? 'コミュニティ' : bn ? 'কমিউনিটি' : 'Community'}
          </div>
          <h1 className="text-fluid-hero font-black text-white tracking-tight mb-4 leading-[1.06]">
            {ja ? '学生' : bn ? 'শিক্ষার্থী'  : 'Student'}{' '}
            <span className="gradient-text">{ja ? 'ギャラリー' : bn ? 'গ্যালারি' : 'Gallery'}</span>
          </h1>
          <p className="text-fluid-base text-white/45 max-w-lg mx-auto leading-relaxed">
            {ja
              ? '学生の旅、マイルストーン、パートナーの成功事例をご覧ください。'
              : bn
              ? 'শিক্ষার্থীদের যাত্রা, মাইলস্টোন এবং পার্টনারদের সাফল্যের গল্প।'
              : 'Real success stories, milestones, and journeys from Tensai students and partners across the globe.'}
          </p>
        </div>
      </section>

      {/* ── Category Filter ────────────────────────────────── */}
      <div className="sticky top-16 z-40 bg-[#0d1117]/80 backdrop-blur-xl border-b border-white/[0.05] px-4 py-3">
        <div className="max-w-7xl mx-auto relative">
          <div className="overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 min-w-max pr-8">
            {CATEGORIES.map((cat) => {
              const label = ja ? cat.labelJa : bn ? cat.labelBn : cat.labelEn;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActive(cat.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    active === cat.key
                      ? 'bg-green-600 text-white shadow-md shadow-green-600/25'
                      : 'text-white/45 hover:text-white hover:bg-white/[0.07] border border-white/[0.08]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0d1117]/80 to-transparent pointer-events-none md:hidden" aria-hidden="true" />
        </div>
      </div>

      {/* ── Branch Filter — separate from category: "which branch" vs "what kind of photo" ── */}
      {branches.length > 0 && (
        <div className="bg-[#0d1117] px-4 py-3 border-b border-white/[0.05]">
          <div className="max-w-7xl mx-auto relative">
            <div className="overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-2 min-w-max pr-8">
                <span className="text-white/25 text-xs shrink-0">📍</span>
                <button
                  onClick={() => setActiveBranch('all')}
                  className={`px-3.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap border ${
                    activeBranch === 'all'
                      ? 'border-green-500/40 text-green-400 bg-green-500/10'
                      : 'border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {ja ? 'すべての支局' : bn ? 'সব শাখা' : 'All Branches'}
                </button>
                {branches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setActiveBranch(b.slug)}
                    className={`px-3.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap border ${
                      activeBranch === b.slug
                        ? 'border-green-500/40 text-green-400 bg-green-500/10'
                        : 'border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Grid ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-12">

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-white/[0.04] animate-pulse border border-white/[0.06]" />
            ))}
          </div>
        )}

        {/* Real gallery items */}
        {hasData && (
          <>
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-4">{'🔍'}</div>
                <p className="text-white/40 text-sm">
                  {ja ? 'このカテゴリにはまだ写真がありません。' : bn ? 'এই বিভাগে এখনো কোনো ছবি নেই।' : 'No photos in this category yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLightbox(item)}
                    className="group relative aspect-square rounded-2xl overflow-hidden border border-white/[0.08] hover:border-green-500/30 transition-all text-left cursor-zoom-in"
                  >
                    <RemoteImage
                      src={item.image_url}
                      alt={item.title}
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Source identity — always visible, so it's clear at a glance whether
                        this is a specific branch's post or a company-wide one */}
                    {item.branch && (
                      <span className="absolute top-2 right-2 z-10 text-[9px] font-semibold text-white/90 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full truncate max-w-[85%]">
                        📍 {item.branch.name}
                      </span>
                    )}
                    {/* Always visible on mobile, hover-reveal on desktop */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-4 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-300">
                      <p className="text-white font-bold text-xs leading-tight mb-0.5 line-clamp-1">{item.title}</p>
                      {item.description && (
                        <p className="text-white/55 text-[10px] leading-snug line-clamp-2 hidden md:block">{item.description}</p>
                      )}
                      {item.category && (
                        <span className="mt-1.5 self-start text-[9px] font-bold text-green-400 bg-green-400/15 border border-green-400/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Contribute CTA below real grid */}
            <div className="mt-10 glass-card rounded-2xl p-6 sm:p-8 text-center max-w-lg mx-auto">
              <div className="text-3xl mb-3">{'📸'}</div>
              <h3 className="text-white font-bold text-sm mb-1.5">
                {ja ? 'あなたのストーリーをシェアしませんか？' : bn ? 'আপনার গল্প শেয়ার করুন' : 'Share your story'}
              </h3>
              <p className="text-white/40 text-xs mb-5 leading-relaxed">
                {ja
                  ? 'Tensaiで夢を叶えた学生の写真や体験談をお待ちしています。'
                  : bn
                  ? 'টেনসাই দিয়ে স্বপ্ন পূরণের ছবি ও গল্প পাঠান।'
                  : 'If you are a Tensai student or partner, send us your photos and we will feature you here.'}
              </p>
              <a
                href="mailto:hello@tensaiconsultancy.com"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-full text-xs font-bold transition-all glow-green"
              >
                {ja ? '写真を送る →' : bn ? 'ছবি পাঠান →' : 'Send Your Photos →'}
              </a>
            </div>
          </>
        )}

        {/* Beautiful empty state (no API data yet) */}
        {!loading && !hasData && (
          <>
            <div className="text-center mb-10">
              <p className="text-white/28 text-xs font-semibold tracking-[0.3em] uppercase">
                {ja ? '近日公開' : bn ? 'শীঘ্রই আসছে' : 'Coming Soon'}
              </p>
              <p className="text-white/40 text-sm mt-2 max-w-sm mx-auto">
                {ja
                  ? '私たちは今、コンテンツを準備中です。最初の写真が間もなく追加されます。'
                  : bn
                  ? 'আমরা এখন কন্টেন্ট প্রস্তুত করছি। শীঘ্রই প্রথম ছবি যোগ হবে।'
                  : "We're building this out. The first photos will be added soon — check back shortly."}
              </p>
            </div>

            {/* Placeholder grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {PLACEHOLDER_CARDS.map((p) => {
                const label = ja ? p.labelJa : bn ? p.labelBn : p.labelEn;
                return (
                  <div
                    key={p.category}
                    className="aspect-square rounded-2xl glass-card flex flex-col items-center justify-center gap-3 text-center p-5 card-hover-glow transition-all"
                  >
                    <div className="text-4xl">{p.emoji}</div>
                    <div className="text-xs font-semibold text-white/55 leading-snug">{label}</div>
                    <div className="text-[10px] text-white/25 bg-white/[0.04] border border-white/[0.07] px-2.5 py-0.5 rounded-full">
                      {ja ? '準備中' : bn ? 'প্রস্তুতি চলছে' : 'Preparing'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Invite CTA */}
            <div className="mt-12 glass-card rounded-2xl p-8 text-center max-w-lg mx-auto">
              <div className="text-3xl mb-4">{'📸'}</div>
              <h3 className="text-white font-bold text-sm mb-2">
                {ja ? 'あなたのストーリーをシェアしませんか？' : bn ? 'আপনার গল্প শেয়ার করুন' : 'Share your story'}
              </h3>
              <p className="text-white/40 text-xs mb-5 leading-relaxed">
                {ja
                  ? 'Tensaiで夢を叶えた学生の写真や体験談をお待ちしています。'
                  : bn
                  ? 'টেনসাই দিয়ে স্বপ্ন পূরণের ছবি ও গল্প পাঠান।'
                  : 'If you are a Tensai student or partner, send us your photos and we will feature you here.'}
              </p>
              <a
                href="mailto:hello@tensaiconsultancy.com"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-full text-xs font-bold transition-all glow-green"
              >
                {ja ? '写真を送る →' : bn ? 'ছবি পাঠান →' : 'Send Your Photos →'}
              </a>
            </div>
          </>
        )}
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-8 px-4 bg-alt-section mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/tensai-logo.png" alt="Tensai" width={28} height={28} className="rounded-full object-contain" />
            <span className="text-sm font-bold text-white/75">Tensai</span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/38">
            <Link href="/about"   className="hover:text-white/65 transition-colors">{a.navAbout}</Link>
            <Link href="/team"    className="hover:text-white/65 transition-colors">{a.navTeam}</Link>
            <Link href="/gallery" className="text-green-400 font-medium">{a.navGallery}</Link>
            <Link href="/terms"   className="hover:text-white/65 transition-colors">{termsText}</Link>
            <Link href="/privacy" className="hover:text-white/65 transition-colors">{privText}</Link>
          </div>
          <p className="text-xs text-white/30">{l.footer}</p>
        </div>
      </footer>

      {/* ── Lightbox ───────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-fade-up"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          <div
            className="max-w-4xl w-full max-h-[90vh] flex flex-col sm:flex-row bg-[#0d1117] rounded-2xl overflow-hidden border border-white/[0.1]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full sm:w-2/3 flex flex-col bg-black shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxImage ?? lightbox.image_url}
                alt={lightbox.title}
                className="w-full max-h-[45vh] sm:max-h-[80vh] object-contain bg-black"
              />
              {!!lightbox.extra_image_urls?.length && (
                <div className="flex gap-2 p-2 justify-center bg-black/60">
                  {[lightbox.image_url, ...lightbox.extra_image_urls].map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt=""
                      onClick={() => setLightboxImage(url)}
                      className={`w-14 h-14 object-cover rounded-lg cursor-pointer border-2 transition-all ${(lightboxImage ?? lightbox.image_url) === url ? 'border-green-400' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="p-5 sm:p-6 flex flex-col overflow-y-auto">
              <div className="flex flex-wrap gap-2 mb-3">
                {lightbox.category && (
                  <span className="text-[9px] font-bold text-green-400 bg-green-400/15 border border-green-400/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {lightbox.category}
                  </span>
                )}
                {lightbox.branch && (
                  <Link href={`/branches/${lightbox.branch.slug}`}
                    className="text-[9px] font-bold text-white/70 hover:text-white bg-white/[0.08] border border-white/[0.12] px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors">
                    📍 {lightbox.branch.name}
                  </Link>
                )}
              </div>
              <h3 className="text-white font-bold text-lg leading-tight mb-2">{lightbox.title}</h3>
              {lightbox.description && (
                <p className="text-white/55 text-sm leading-relaxed">{lightbox.description}</p>
              )}
              {/* Full story — the admin's rich-text write-up was being saved but never
                  shown anywhere on the public site; only the short summary rendered. */}
              {lightbox.content && (
                <div
                  className="mt-4 pt-4 border-t border-white/[0.08] text-white/65 text-sm leading-relaxed
                    [&_h1]:text-white [&_h1]:font-black [&_h1]:text-base [&_h1]:mt-4 [&_h1]:mb-2
                    [&_h2]:text-white [&_h2]:font-bold [&_h2]:text-base [&_h2]:mt-4 [&_h2]:mb-2
                    [&_h3]:text-white [&_h3]:font-bold [&_h3]:text-sm [&_h3]:mt-3 [&_h3]:mb-1.5
                    [&_p]:my-2.5 [&_strong]:text-white [&_strong]:font-bold [&_em]:italic
                    [&_a]:text-green-400 [&_a]:underline hover:[&_a]:text-green-300
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2.5 [&_li]:my-1
                    [&_blockquote]:border-l-2 [&_blockquote]:border-green-500/40 [&_blockquote]:pl-3 [&_blockquote]:text-white/50 [&_blockquote]:italic"
                  dangerouslySetInnerHTML={{ __html: lightbox.content }}
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
