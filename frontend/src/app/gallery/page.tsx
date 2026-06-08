'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://tensai-production-3af6.up.railway.app/api';

interface GalleryItem {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  category: string;
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

export default function GalleryPage() {
  const { t, lang, toggle } = useLang();
  const l = t.landing;
  const a = t.about;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const [items, setItems]       = useState<GalleryItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [active, setActive]     = useState('all');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    fetch(`${API}/gallery`)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = active === 'all' ? items : items.filter((i) => i.category === active);
  const hasData  = !loading && items.length > 0;

  const termsText = ja ? '利用規約'   : bn ? 'শর্তাবলী'  : 'Terms';
  const privText  = ja ? 'プライバシー' : bn ? 'প্রাইভেসি' : 'Privacy';

  return (
    <div className="min-h-screen bg-[#0d1117]">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-nav' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/tensai-logo.png" alt="Tensai" width={36} height={36} className="rounded-full object-contain" />
            <div>
              <div className="text-base font-bold text-white tracking-tight leading-none">Tensai</div>
              <div className="text-[9px] text-white/35 tracking-wider leading-none mt-0.5 hidden sm:block">THE WAY OF GLOBAL CAREER</div>
            </div>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={toggle}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10 text-white/60 hover:border-green-500/40 hover:text-green-400 transition-all"
            >
              {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
            </button>
            <Link href="/about"   className="text-sm text-white/50 hover:text-white transition-colors px-2 py-1 hidden md:inline">{a.navAbout}</Link>
            <Link href="/team"    className="text-sm text-white/50 hover:text-white transition-colors px-2 py-1 hidden md:inline">{a.navTeam}</Link>
            <Link href="/gallery" className="text-sm font-semibold text-green-400 px-2 py-1 hidden md:inline border-b border-green-500/50">{a.navGallery}</Link>
            <Link href="/auth/login"    className="text-sm text-white/65 hover:text-white transition-colors px-3 py-1.5">{l.login}</Link>
            <Link href="/auth/register" className="text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full font-semibold transition-all glow-green">{l.getStarted}</Link>
          </div>
        </div>
      </nav>

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
              ? '学生の旅、マイルストーン、そして日本への成功事例をご覧ください。'
              : bn
              ? 'শিক্ষার্থীদের যাত্রা, মাইলস্টোন এবং জাপানের সাফল্যের গল্প।'
              : 'Success stories, milestones, and journeys of Tensai students on their way to Japan.'}
          </p>
        </div>
      </section>

      {/* ── Category Filter ────────────────────────────────── */}
      <div className="sticky top-16 z-40 bg-[#0d1117]/80 backdrop-blur-xl border-b border-white/[0.05] px-4 py-3">
        <div className="max-w-7xl mx-auto overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
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
      </div>

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
                  <div
                    key={item.id}
                    className="group relative aspect-square rounded-2xl overflow-hidden border border-white/[0.08] hover:border-green-500/30 transition-all"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <p className="text-white font-bold text-xs leading-tight mb-0.5">{item.title}</p>
                      {item.description && (
                        <p className="text-white/55 text-[10px] leading-snug line-clamp-2">{item.description}</p>
                      )}
                      <span className="mt-2 self-start text-[9px] font-bold text-green-400 bg-green-400/15 border border-green-400/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                href="mailto:support@tensai.com"
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

    </div>
  );
}
