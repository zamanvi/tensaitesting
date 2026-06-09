'use client';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface GalleryItem {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  category: string;
}

export default function HomePage() {
  const { t, lang, toggle } = useLang();
  const l = t.landing;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const [featured, setFeatured] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryError, setGalleryError] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setGalleryLoading(true);
    setGalleryError(false);
    api.get<GalleryItem[]>('/gallery/featured')
      .then((r) => {
        setFeatured(Array.isArray(r.data) ? r.data : []);
      })
      .catch(() => {
        setGalleryError(true);
      })
      .finally(() => {
        setGalleryLoading(false);
      });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Data ──────────────────────────────────────────────── */

  /* Trust ticker — trilingual */
  const TICKER = [
    ja ? '100% OCR検証済み'      : bn ? '১০০% OCR যাচাইকৃত'          : '100% OCR Verified',
    ja ? '偽プロフィール0件'      : bn ? '০টি ভুয়া প্রোফাইল'           : '0 Fake Profiles',
    ja ? 'AI適格性スコアリング'   : bn ? 'AI যোগ্যতা স্কোরিং'           : 'AI Eligibility Scoring',
    ja ? 'バングラデシュ→日本'    : bn ? 'বাংলাদেশ → জাপান'             : 'Bangladesh → Japan',
    ja ? 'エスクロー決済保護'     : bn ? 'এসক্রো পেমেন্ট সুরক্ষা'       : 'Escrow Payment Protection',
    ja ? 'QRセキュア追跡'        : bn ? 'QR নিরাপদ ট্র্যাকিং'           : 'QR Secure Tracking',
    ja ? 'プライバシーファースト' : bn ? 'প্রাইভেসি-ফার্স্ট আর্কিটেকচার' : 'Privacy-First Architecture',
    ja ? 'データ改ざんゼロ'       : bn ? 'শূন্য ডেটা টেম্পারিং'          : 'Zero Data Tampering',
  ];

  const GATEWAYS = [
    {
      type: 'student',
      icon: '🎓',
      title: l.gateways.studentTitle,
      desc: l.gateways.studentDesc,
      tag: ja ? '最も人気' : bn ? 'সবচেয়ে জনপ্রিয়' : 'Most Popular',
      featured: true,
    },
    { type: 'agency',      icon: '🏢', title: l.gateways.agencyTitle,      desc: l.gateways.agencyDesc,      tag: null, featured: false },
    { type: 'institution', icon: '🏫', title: l.gateways.institutionTitle, desc: l.gateways.institutionDesc, tag: null, featured: false },
    { type: 'affiliate',   icon: '💼', title: l.gateways.affiliateTitle,   desc: l.gateways.affiliateDesc,   tag: null, featured: false },
  ];

  const FEATURES = [
    { icon: '🔒', title: l.features.f1Title, desc: l.features.f1Desc, color: 'from-green-500/20 to-green-600/5' },
    { icon: '🤝', title: l.features.f2Title, desc: l.features.f2Desc, color: 'from-cyan-500/20 to-cyan-600/5' },
    { icon: '🛡️', title: l.features.f3Title, desc: l.features.f3Desc, color: 'from-violet-500/20 to-violet-600/5' },
    { icon: '📋', title: l.features.f4Title, desc: l.features.f4Desc, color: 'from-amber-500/20 to-amber-600/5' },
  ];

  const STATS = [
    { value: '100%',  label: ja ? 'OCR認証'            : bn ? 'OCR যাচাই'        : 'OCR Verified'        },
    { value: '0',     label: ja ? '偽プロフィール'      : bn ? 'ভুয়া প্রোফাইল'    : 'Fake Profiles'       },
    { value: 'AI',    label: ja ? '適格性スコアリング'  : bn ? 'যোগ্যতা স্কোরিং'  : 'Eligibility Scoring' },
    { value: 'BD→JP', label: ja ? '最初のルート'        : bn ? 'প্রথম করিডোর'     : 'First Corridor'      },
  ];

  const HOW_IT_WORKS = [
    {
      num: '01',
      icon: '📄',
      title: ja ? '登録 & 書類アップロード' : bn ? 'নিবন্ধন করুন ও কাগজপত্র আপলোড করুন' : 'Register & Upload Docs',
      desc: ja
        ? 'プロフィールを作成し書類をアップロード。AIがOCRで即座にスキャンし、永久にロックします。'
        : bn
        ? 'প্রোফাইল তৈরি করুন ও কাগজপত্র আপলোড করুন। AI তাৎক্ষণিকভাবে OCR স্ক্যান করে চিরতরে লক করে।'
        : 'Create your profile and upload documents. AI instantly scans and OCR-locks every file — permanently.',
    },
    {
      num: '02',
      icon: '🤖',
      title: ja ? 'AIがスコア & マッチング' : bn ? 'AI স্কোর করে ও ম্যাচ করে' : 'AI Scores & Matches You',
      desc: ja
        ? '適格性スコアを算出し、日本の認定機関・エージェンシーとマッチングします。'
        : bn
        ? 'যোগ্যতা স্কোর গণনা করে জাপানের যাচাইকৃত প্রতিষ্ঠান ও এজেন্সির সাথে মিলিয়ে দেয়।'
        : 'Your eligibility score is calculated and you are matched with verified agencies and institutions in Japan.',
    },
    {
      num: '03',
      icon: '✈️',
      title: ja ? '安全に日本へ' : bn ? 'নিরাপদে জাপানে যান' : 'Get Placed — Safely',
      desc: ja
        ? 'エスクロー決済が費用を保護。QR追跡で進捗を確認。あなたのプライバシーは守られます。'
        : bn
        ? 'এসক্রো পেমেন্ট ফি সুরক্ষিত রাখে। QR ট্র্যাকিং আপডেট দেয়। আপনার প্রাইভেসি সুরক্ষিত থাকে।'
        : 'Escrow protects your fees. QR tracking keeps you updated every step. Your privacy stays intact.',
    },
  ];

  /* Derive nav/footer labels from i18n */
  const navAbout  = l.about;
  const navTeam   = l.team;
  const termsText = l.terms;
  const privText  = l.privacy;

  /* Lang toggle label — next language in cycle */
  const toggleLabel = lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English';
  const toggleAriaLabel = lang === 'en'
    ? 'Switch to Bangla'
    : lang === 'bn'
    ? '日本語に切り替える'
    : 'Switch to English';

  return (
    <div className="min-h-screen bg-[#0d1117]">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav
        aria-label={ja ? 'メインナビゲーション' : bn ? 'প্রধান নেভিগেশন' : 'Main navigation'}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-nav' : 'bg-transparent'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/tensai-logo.png" alt="Tensai" width={36} height={36} className="rounded-full object-contain" priority />
            <div>
              <div className="text-base font-bold text-white tracking-tight leading-none">Tensai</div>
              <div className="text-[9px] text-white/35 tracking-wider leading-none mt-0.5 hidden sm:block">
                {ja ? 'グローバルキャリアへの道' : bn ? 'বৈশ্বিক ক্যারিয়ারের পথ' : 'THE WAY OF GLOBAL CAREER'}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggle}
              aria-label={toggleAriaLabel}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10 text-white/60 hover:border-green-500/40 hover:text-green-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            >
              {toggleLabel}
            </button>
            <Link href="/about"   className="text-sm text-white/50 hover:text-white transition-colors px-2 py-1 hidden md:inline">{navAbout}</Link>
            <Link href="/team"    className="text-sm text-white/50 hover:text-white transition-colors px-2 py-1 hidden md:inline">{navTeam}</Link>
            <Link href="/gallery" className="text-sm text-white/50 hover:text-white transition-colors px-2 py-1 hidden md:inline">{l.gallery}</Link>
            <Link href="/auth/login" className="text-sm text-white/65 hover:text-white transition-colors px-3 py-1.5">{l.login}</Link>
            <Link
              href="/auth/register"
              className="text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full font-semibold transition-all glow-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
            >
              {l.getStarted}
            </Link>
          </div>
        </div>
      </nav>

      <main>

        {/* ── Hero — Split Layout ────────────────────────────── */}
        <section className="hero-mesh min-h-screen flex items-center px-4 pt-20 pb-16 relative overflow-hidden">

          {/* Enhanced ambient orbs */}
          <div className="absolute top-[15%] left-[8%]  w-[480px] h-[480px] bg-green-600/12  rounded-full blur-[140px] pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-[20%] right-[5%]  w-[380px] h-[380px] bg-cyan-500/8   rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
          <div className="absolute top-[60%] left-[40%]  w-[300px] h-[300px] bg-violet-600/6  rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />

          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.022] pointer-events-none"
            aria-hidden="true"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />

          <div className="relative z-10 max-w-7xl mx-auto w-full">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20">

              {/* ── Left: Copy ──────────────────────────────── */}
              <div className="flex-1 text-center lg:text-left animate-fade-up">

                {/* Live badge */}
                <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-7 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" aria-hidden="true" />
                  {l.badge}
                </div>

                {/* Headline */}
                <h1 className="text-fluid-hero font-black text-white tracking-tight mb-3 leading-[1.06]">
                  {l.heroTitle}<br />
                  <span className="gradient-text">{l.heroHighlight}</span>
                </h1>

                {/* Decorative sub-label */}
                <p className={`text-white/28 text-xs font-medium mb-5 ${lang === 'en' ? 'tracking-[0.25em] uppercase' : 'tracking-normal'}`} aria-hidden="true">
                  {ja ? 'グローバルキャリアへの道 · 天才' : bn ? 'বৈশ্বিক ক্যারিয়ারের পথ · টেনসাই' : 'The Way of Global Career · Tensai'}
                </p>

                {/* Sub-copy */}
                <p className="text-fluid-base text-white/48 max-w-xl lg:mx-0 mx-auto mb-9 leading-relaxed">
                  {l.heroSub}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 mb-10 max-w-lg lg:mx-0 mx-auto">
                  <Link
                    href="/auth/register?type=student"
                    className="flex-[1.4] text-center bg-green-600 hover:bg-green-500 text-white px-6 py-4 rounded-full font-bold text-sm transition-all glow-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                  >
                    {l.ctaStudent}
                  </Link>
                  <Link
                    href="/auth/register?type=agency"
                    className="flex-1 text-center glass-card text-white/75 hover:text-white px-5 py-3.5 rounded-full font-semibold text-sm transition-all border border-white/10 hover:border-white/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    {l.ctaAgency}
                  </Link>
                  <Link
                    href="/auth/register?type=institution"
                    className="flex-1 text-center glass-card text-white/75 hover:text-white px-5 py-3.5 rounded-full font-semibold text-sm transition-all border border-white/10 hover:border-white/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    {l.ctaInstitution}
                  </Link>
                </div>

                {/* Stats strip — use index keys (labels change with lang) */}
                <div className="overflow-x-auto justify-center lg:justify-start flex">
                  <div className="inline-flex items-stretch rounded-2xl overflow-hidden border border-white/[0.08] divide-x divide-white/[0.08] min-w-max">
                    {STATS.map((s, i) => (
                      <div key={i} className="px-5 sm:px-6 py-3 bg-white/[0.03] text-center">
                        <div className="text-white font-bold text-sm leading-tight">{s.value}</div>
                        <div className="text-white/38 text-[10px] mt-0.5 whitespace-nowrap">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Right: Student Profile Mockup (decorative) ──── */}
              <div className="hidden lg:block lg:flex-none w-72 xl:w-80 animate-slide-right" aria-hidden="true">
                <div className="gateway-featured glass-card rounded-2xl p-5 space-y-4 relative">

                  {/* Active pulse */}
                  <span className="absolute top-4 right-4 flex items-center gap-1.5 text-[10px] text-green-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    LIVE
                  </span>

                  {/* Profile header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/30 to-cyan-500/20 border border-green-500/25 flex items-center justify-center text-lg">
                      {'🎓'}
                    </div>
                    <div>
                      <div className="text-white text-xs font-bold leading-tight">
                        {ja ? '学生プロフィール' : bn ? 'শিক্ষার্থীর প্রোফাইল' : 'Student Profile'}
                      </div>
                      <div className="text-green-400 text-[10px] font-medium">
                        {ja ? 'AI認証済み ✓' : bn ? 'AI যাচাইকৃত ✓' : 'AI Verified ✓'}
                      </div>
                    </div>
                  </div>

                  {/* AI Score bar */}
                  <div>
                    <div className="flex justify-between text-[10px] mb-1.5">
                      <span className="text-white/45">{ja ? 'AI適格性スコア' : bn ? 'AI যোগ্যতা স্কোর' : 'AI Eligibility Score'}</span>
                      <span className="text-green-400 font-bold">94 / 100</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full w-[94%] bg-gradient-to-r from-green-500 to-cyan-400 rounded-full" />
                    </div>
                  </div>

                  {/* OCR-locked docs */}
                  <div className="space-y-2">
                    <div className="text-[10px] text-white/30 font-medium uppercase tracking-wider">
                      {ja ? '書類ロック' : bn ? 'ডকুমেন্ট লক' : 'Document Lock'}
                    </div>
                    {[
                      { name: ja ? 'パスポート'         : bn ? 'পাসপোর্ট'              : 'Passport'              },
                      { name: ja ? 'IELTS証明書'        : bn ? 'IELTS সার্টিফিকেট'     : 'IELTS Certificate'     },
                      { name: ja ? '学業成績証明書'      : bn ? 'একাডেমিক ট্রান্সক্রিপ্ট': 'Academic Transcript'   },
                    ].map((d) => (
                      <div key={d.name} className="flex items-center justify-between bg-white/[0.04] rounded-lg px-3 py-1.5">
                        <span className="text-[10px] text-white/55">{d.name}</span>
                        <span className="text-[10px] text-green-400 font-semibold">{'🔒'} OCR</span>
                      </div>
                    ))}
                  </div>

                  {/* Placement status */}
                  <div className="flex items-center gap-3 bg-green-500/[0.08] border border-green-500/[0.18] rounded-xl p-3">
                    <span className="text-xl">{'🇯🇵'}</span>
                    <div className="flex-1">
                      <div className="text-white text-[11px] font-bold leading-tight">
                        {ja ? '日本配置済み' : bn ? 'জাপানে প্লেসমেন্ট রেডি' : 'Japan Placement Ready'}
                      </div>
                      <div className="text-white/38 text-[9px] mt-0.5">
                        {ja ? 'エスクロー保護中' : bn ? 'এসক্রো সুরক্ষিত' : 'Escrow Protected · QR Tracked'}
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                  </div>

                  {/* Floating badge decorations */}
                  <div className="absolute -top-3 -right-3 bg-[#0d1117] border border-green-500/25 rounded-full px-2.5 py-1 text-[9px] text-green-400 font-bold shadow-lg">
                    AI ✓
                  </div>
                  <div className="absolute -bottom-3 -left-3 bg-[#0d1117] border border-cyan-500/25 rounded-full px-2.5 py-1 text-[9px] text-cyan-400 font-bold shadow-lg">
                    {'🔒'} OCR
                  </div>
                </div>

                {/* Trust note below card */}
                <p className="text-center text-[10px] text-white/25 mt-5 leading-relaxed">
                  {ja ? 'すべてのデータはAIによって自動的にロックされます' : bn ? 'সব তথ্য AI দ্বারা স্বয়ংক্রিয়ভাবে লক হয়' : 'All data is automatically locked by AI on upload'}
                </p>
              </div>

            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0d1117] to-transparent pointer-events-none" aria-hidden="true" />
        </section>

        {/* ── Trust Ticker (decorative — hidden from screen readers) ── */}
        <div
          className="border-y border-white/[0.05] py-3.5 overflow-hidden bg-white/[0.015]"
          aria-hidden="true"
        >
          <div className="flex animate-marquee gap-0">
            {[...TICKER, ...TICKER].map((item, i) => (
              <span key={i} className="flex items-center gap-3 px-6 text-[11px] font-semibold text-white/35 whitespace-nowrap shrink-0">
                <span className="w-1 h-1 rounded-full bg-green-500/60 shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* ── Gateway Bento Grid ─────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 pt-20 pb-20">
          <div className="text-center mb-10">
            <p className="text-white/28 text-[11px] font-semibold tracking-[0.3em] uppercase mb-2">
              {ja ? 'ゲートウェイを選択' : bn ? 'আপনার গেটওয়ে বেছে নিন' : 'Choose Your Gateway'}
            </p>
            <h2 className="text-fluid-4xl font-bold text-white">
              {ja ? '誰のために作られたか' : bn ? 'সবার জন্য তৈরি' : 'Built for everyone in the ecosystem'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GATEWAYS.map((g) => (
              <Link
                key={g.type}
                href={`/auth/register?type=${g.type}`}
                className={`group rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400
                  ${g.featured
                    ? 'sm:col-span-2 lg:col-span-2 glass-card gateway-featured'
                    : 'glass-card card-hover-glow'
                  }`}
              >
                {g.tag && (
                  <span className="absolute top-3.5 right-3.5 text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                    {g.tag}
                  </span>
                )}
                <div className="text-3xl" aria-hidden="true">{g.icon}</div>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1.5">{g.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{g.desc}</p>
                </div>
                <div className="mt-auto text-xs text-green-400 font-semibold flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                  <span>{ja ? '詳しく見る' : bn ? 'শুরু করুন' : 'Get started'}</span>
                  <span className="group-hover:translate-x-1 transition-transform inline-block" aria-hidden="true">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── How It Works ───────────────────────────────────── */}
        <section className="bg-alt-section py-20 border-t border-white/[0.05]">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-14">
              <p className="text-white/28 text-[11px] font-semibold tracking-[0.3em] uppercase mb-2">
                {ja ? 'プロセス' : bn ? 'প্রক্রিয়া' : 'Process'}
              </p>
              <h2 className="text-fluid-4xl font-bold text-white">
                {ja ? 'どのように機能するか' : bn ? 'কীভাবে কাজ করে' : 'How it works'}
              </h2>
              <p className="text-fluid-sm text-white/38 mt-3 max-w-md mx-auto">
                {ja ? '3ステップで日本への道が開きます' : bn ? 'মাত্র ৩ ধাপে জাপানের পথ খুলে যায়' : 'Three clear steps from registration to Japan placement'}
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-6 md:gap-0">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.num} className="flex flex-row md:flex-col items-start md:items-center md:flex-1 gap-5 md:gap-0 md:text-center">
                  {/* Step number + icon */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20 flex items-center justify-center text-2xl" aria-hidden="true">
                      {step.icon}
                    </div>
                    <span className="text-[10px] text-green-500/70 font-black tracking-wider" aria-hidden="true">{step.num}</span>
                  </div>

                  {/* Connector — decorative */}
                  {i < 2 && (
                    <div className="hidden md:block step-connector mx-4 mt-7" aria-hidden="true" />
                  )}
                  {i < 2 && (
                    <div className="md:hidden w-px h-8 bg-green-500/20 ml-7 mt-1 self-start" aria-hidden="true" />
                  )}

                  {/* Content */}
                  <div className="flex-1 md:px-4 md:mt-5">
                    <h3 className="text-white font-bold text-sm mb-2 leading-snug">{step.title}</h3>
                    <p className="text-[12px] text-white/45 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-8 py-3.5 rounded-full font-bold text-sm transition-all glow-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
              >
                {ja ? '今すぐ始める →' : bn ? 'এখনই শুরু করুন →' : 'Start your journey →'}
              </Link>
            </div>
          </div>
        </section>

        {/* ── Why Tensai ─────────────────────────────────────── */}
        <section className="py-20 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-white/28 text-[11px] font-semibold tracking-[0.3em] uppercase mb-2">
                {ja ? 'なぜ天才か' : bn ? 'কেন টেনসাই' : 'Why Tensai'}
              </p>
              <h2 className="text-fluid-4xl font-bold text-white mb-3">{l.whyTitle}</h2>
              <p className="text-fluid-base text-white/40 max-w-xl mx-auto leading-relaxed">{l.whySub}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="glass-card rounded-2xl p-6 flex flex-col gap-4 card-hover-glow transition-all duration-300">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-xl`} aria-hidden="true">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-white text-sm leading-snug">{f.title}</h3>
                  <p className="text-xs text-white/55 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BD → JP Corridor ───────────────────────────────── */}
        <section className="bg-alt-section py-20 px-4 border-t border-white/[0.05]">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 via-transparent to-cyan-600/5 rounded-3xl pointer-events-none" aria-hidden="true" />
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-3 sm:gap-5 mb-7" aria-hidden="true">
                  <span className="text-4xl animate-float">{'🇧🇩'}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 sm:w-20 h-px bg-gradient-to-r from-white/15 to-green-400/60" />
                    <span className="text-green-400 text-base">{'✈️'}</span>
                    <div className="w-12 sm:w-20 h-px bg-gradient-to-r from-green-400/60 to-white/15" />
                  </div>
                  <span className="text-4xl animate-float" style={{ animationDelay: '2s' }}>{'🇯🇵'}</span>
                </div>

                <h3 className="text-fluid-3xl font-bold text-white mb-3">
                  {ja ? 'バングラデシュから日本へ' : bn ? 'বাংলাদেশ থেকে জাপান' : 'Bangladesh → Japan'}
                </h3>
                <p className="text-fluid-base text-white/48 max-w-lg mx-auto mb-6 leading-relaxed">
                  {ja
                    ? '最初のルートはバングラデシュから日本。日本は最も厳格な認証基準を求める — だからこそ最初に選んだ。その基準を満たせるなら、世界中に通用する。'
                    : bn
                    ? 'আমাদের প্রথম করিডোর। জাপান বিশ্বের কঠোরতম যাচাই মান দাবি করে — তাই আমরা এখান থেকেই শুরু করেছি। জাপানের জন্য তৈরি সিস্টেম সর্বত্র কাজ করে।'
                    : 'Our first corridor. Japan demands the strictest verification standards in the world — that is exactly why we started here. A system built for Japan works everywhere.'}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-8 text-xs text-white/40">
                  {[
                    ja ? 'AI適格性スコアリング'  : bn ? 'AI যোগ্যতা স্কোরিং'     : 'AI Eligibility Scoring',
                    ja ? 'OCR書類ロック'        : bn ? 'OCR ডকুমেন্ট লক'         : 'OCR Document Lock',
                    ja ? 'エスクロー決済保護'    : bn ? 'এসক্রো পেমেন্ট সুরক্ষা'  : 'Escrow Payment Protection',
                    ja ? 'QRセキュア追跡'       : bn ? 'QR নিরাপদ ট্র্যাকিং'     : 'QR Secure Tracking',
                  ].map((item) => (
                    <span key={item} className="flex items-center gap-1.5">
                      <span className="text-green-500/60" aria-hidden="true">✓</span> {item}
                    </span>
                  ))}
                </div>

                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.13] border border-white/[0.12] hover:border-green-500/30 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  {ja ? '私たちのストーリーを読む →' : bn ? 'আমাদের গল্প পড়ুন →' : 'Read Our Story →'}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Gallery ────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 py-20 border-t border-white/[0.05]">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
            <div>
              <p className="text-white/28 text-[11px] font-semibold tracking-[0.3em] uppercase mb-1">
                {ja ? 'コミュニティ' : bn ? 'কমিউনিটি' : 'Community'}
              </p>
              <h2 className="text-fluid-3xl font-bold text-white leading-tight">
                {ja ? '学生ギャラリー' : bn ? 'শিক্ষার্থী গ্যালারি' : 'Student Gallery'}
              </h2>
              <p className="text-fluid-sm text-white/38 mt-1 max-w-md">{l.gallerySub}</p>
            </div>
            <Link href="/gallery" className="text-sm font-semibold text-green-400 hover:text-green-300 transition-colors shrink-0">
              {l.galleryViewAll}
            </Link>
          </div>

          {galleryLoading ? (
            /* Loading skeleton */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" role="status" aria-label={ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading gallery...'}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-2xl bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : galleryError ? (
            /* Error state */
            <div className="text-center py-12">
              <div className="text-3xl mb-3" aria-hidden="true">🖼️</div>
              <p className="text-white/38 text-sm">
                {ja ? 'ギャラリーを読み込めませんでした' : bn ? 'গ্যালারি লোড করা যায়নি' : 'Could not load gallery'}
              </p>
              <Link href="/gallery" className="mt-3 inline-block text-sm text-green-400 hover:text-green-300 transition-colors">
                {l.galleryViewAll}
              </Link>
            </div>
          ) : featured.length === 0 ? (
            /* Empty placeholder */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { emoji: '🎓', label: ja ? '学生の旅'              : bn ? 'শিক্ষার্থীর যাত্রা'  : 'Student Journeys'  },
                { emoji: '🏆', label: ja ? 'マイルストーン'         : bn ? 'মাইলস্টোন'            : 'Milestones'        },
                { emoji: '🌏', label: ja ? '日本進学'               : bn ? 'জাপান প্লেসমেন্ট'     : 'Japan Placements'  },
                { emoji: '🤝', label: ja ? 'エージェンシーパートナー': bn ? 'এজেন্সি পার্টনার'     : 'Agency Partners'   },
              ].map((p) => (
                <div key={p.label} className="aspect-square rounded-2xl glass-card flex flex-col items-center justify-center gap-2 text-center p-4">
                  <div className="text-3xl sm:text-4xl" aria-hidden="true">{p.emoji}</div>
                  <div className="text-xs sm:text-sm font-medium text-white/55 leading-snug">{p.label}</div>
                  <div className="text-[10px] text-white/28">{ja ? '近日公開' : bn ? 'শীঘ্রই আসছে' : 'Coming soon'}</div>
                </div>
              ))}
            </div>
          ) : (
            /* Real gallery images */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map((item) => (
                <Link
                  key={item.id}
                  href="/gallery"
                  aria-label={item.title}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-white/[0.08] hover:border-green-500/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-white font-semibold text-xs leading-tight">{item.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] hover:border-green-500/30 text-white/65 hover:text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              {ja ? 'ギャラリーをすべて見る →' : bn ? 'সম্পূর্ণ গ্যালারি দেখুন →' : 'Browse Full Gallery →'}
            </Link>
          </div>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-8 px-4 bg-alt-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/tensai-logo.png" alt="Tensai" width={30} height={30} className="rounded-full object-contain" />
              <span className="text-sm font-bold text-white/80">Tensai</span>
            </Link>
            <nav aria-label={ja ? 'フッターナビゲーション' : bn ? 'ফুটার নেভিগেশন' : 'Footer navigation'}>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/38">
                <Link href="/about"   className="hover:text-white/65 transition-colors">{navAbout}</Link>
                <Link href="/team"    className="hover:text-white/65 transition-colors">{navTeam}</Link>
                <Link href="/gallery" className="hover:text-white/65 transition-colors">{l.gallery}</Link>
                <Link href="/terms"   className="hover:text-white/65 transition-colors">{termsText}</Link>
                <Link href="/privacy" className="hover:text-white/65 transition-colors">{privText}</Link>
              </div>
            </nav>
            <p className="text-xs text-white/32">{l.footer}</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
