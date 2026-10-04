'use client';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SiteHeader from '@/components/shared/SiteHeader';
import EmotionalStorySection from '@/components/home/EmotionalStorySection';
import IntroVideoPlayer, { getYouTubeId } from '@/components/home/IntroVideoSection';

interface GalleryItem {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  category: string;
  branch: { name: string; slug: string } | null;
}

interface SiteSettings {
  facebook_url?: string;
  youtube_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  support_whatsapp?: string;
  support_phone?: string;
  support_email?: string;
  office_address?: string;
  copyright_en?: string;
  copyright_ja?: string;
  copyright_bn?: string;
  intro_video_url?: string;
}

export default function HomePageClient() {
  const { t, lang } = useLang();
  const l = t.landing;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const [featured, setFeatured] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryError, setGalleryError] = useState(false);
  // All 5 testimonials stacked full-height on mobile made this one section a
  // very long scroll — nothing removed, just collapsed behind a toggle.
  const [showAllTestimonials, setShowAllTestimonials] = useState(false);

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ['public-settings'],
    queryFn: () => api.get('/settings/public').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  interface GuidePost {
    id: number; title: string; slug: string; excerpt: string;
    thumbnail: string | null; type: string;
  }
  const { data: guideData } = useQuery<{ data: GuidePost[] }>({
    queryKey: ['home-guide-preview'],
    queryFn: () => api.get('/feed').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const guidePosts = (guideData?.data ?? []).slice(0, 3);

  useEffect(() => {
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

  /* ── Data ──────────────────────────────────────────────── */


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
        ? 'エスクロー決済がすべてのステップで費用を保護。支払いは安全。プライバシーは守られます。'
        : bn
        ? 'এস্ক্রো পেমেন্ট প্রতিটি ধাপে ফি সুরক্ষিত রাখে। আপনার অর্থ নিরাপদ। আপনার প্রাইভেসি অক্ষুণ্ণ থাকে।'
        : 'Escrow protects your fees every step of the way. Your payments are safe. Your privacy stays intact.',
    },
  ];

  const TESTIMONIALS = [
    {
      avatar: 'R',
      name: ja ? 'ラヒム・ウッディン' : bn ? 'রহিম উদ্দিন' : 'Rahim Uddin',
      role: ja ? '学生 · 東京日本語学校' : bn ? 'শিক্ষার্থী · টোকিও জাপানিজ স্কুল' : 'Student · Tokyo Japanese School',
      quote: ja
        ? '書類が偽造されているか心配でしたが、TensaiのOCRロックシステムが完全に保護してくれました。3ヶ月でビザが承認されました。'
        : bn
        ? 'আমার কাগজপত্র জাল হওয়ার ভয় ছিল। Tensai-এর OCR লক সিস্টেম সবকিছু নিরাপদ রেখেছে। মাত্র ৩ মাসে ভিসা অনুমোদন পেয়েছি।'
        : 'I was worried my documents could be tampered with. Tensai\'s OCR lock system kept everything safe. Got my visa approved in just 3 months.',
      flag: '🇯🇵',
      color: 'from-green-500/15 to-green-600/5',
      border: 'border-green-500/20',
    },
    {
      avatar: 'K',
      name: ja ? 'カリム・エージェンシー' : bn ? 'করিম এডুকেশন এজেন্সি' : 'Karim Education Agency',
      role: ja ? 'エージェンシーオーナー · ダッカ' : bn ? 'এজেন্সি মালিক · ঢাকা' : 'Agency Owner · Dhaka',
      quote: ja
        ? 'TensaiのプールシステムでAI検証済みの学生を見つけられます。書類詐欺の問題がなくなり、日本のパートナー校との信頼が向上しました。'
        : bn
        ? 'Tensai-এর পুল সিস্টেমে AI যাচাইকৃত স্টুডেন্ট পাই। ডকুমেন্ট জালিয়াতির সমস্যা শেষ — জাপানি পার্টনার স্কুলের সাথে আমাদের সম্পর্ক অনেক ভালো হয়েছে।'
        : 'We find AI-verified students through Tensai\'s pool system. Zero document fraud issues — our trust with Japanese partner schools has improved dramatically.',
      flag: '🏢',
      color: 'from-cyan-500/15 to-cyan-600/5',
      border: 'border-cyan-500/20',
    },
    {
      avatar: 'Y',
      name: ja ? '山田先生' : bn ? 'ইয়ামাদা সেন্সেই' : 'Yamada-sensei',
      role: ja ? '入学担当 · 大阪語学センター' : bn ? 'ভর্তি সমন্বয়কারী · ওসাকা ল্যাঙ্গুয়েজ সেন্টার' : 'Admissions Coordinator · Osaka Language Center',
      quote: ja
        ? 'AI適格性スコアで学生を事前にスクリーニングできます。ビザ却下率が大幅に低下し、入学プロセスが透明になりました。'
        : bn
        ? 'AI eligibility score দিয়ে আবেদনকারীদের আগে থেকে স্ক্রিন করতে পারি। ভিসা রিজেকশন রেট অনেক কমেছে, ভর্তি প্রক্রিয়া স্বচ্ছ হয়েছে।'
        : 'The AI eligibility score lets us pre-screen applicants before interviews. Visa rejection rates dropped significantly and the admissions process became transparent.',
      flag: '🏫',
      color: 'from-violet-500/15 to-violet-600/5',
      border: 'border-violet-500/20',
    },
    {
      avatar: 'F',
      name: ja ? 'ファリダ・アクター' : bn ? 'ফারিদা আক্তার' : 'Farida Akter',
      role: ja ? 'アフィリエイトパートナー · チッタゴン' : bn ? 'অ্যাফিলিয়েট পার্টনার · চট্টগ্রাম' : 'Affiliate Partner · Chittagong',
      quote: ja
        ? '友人を紹介しました。ダッシュボードで全部追跡できて、支払いも約束通りでした。透明性が高く、信頼できます。'
        : bn
        ? 'বন্ধুকে রেফার করেছিলাম — ড্যাশবোর্ডে সব ট্র্যাক করা যায়, পেমেন্টও প্রতিশ্রুতি মতোই হয়েছে। সম্পূর্ণ স্বচ্ছ ও বিশ্বস্ত।'
        : 'I referred a friend and the whole process was transparent end to end. Everything trackable on the dashboard and the payout came exactly as promised.',
      flag: '💼',
      color: 'from-amber-500/15 to-amber-600/5',
      border: 'border-amber-500/20',
    },
    {
      avatar: 'N',
      name: ja ? 'ナスリン・ベゴム' : bn ? 'নাসরিন বেগম' : 'Nasrin Begum',
      role: ja ? '看護師 · 名古屋医療センター' : bn ? 'নার্স · নাগোয়া মেডিকেল সেন্টার' : 'Nurse · Nagoya Medical Center',
      quote: ja
        ? '医療分野での日本就職は難しいと思っていましたが、TensaiのAIマッチングが最適な病院を見つけてくれました。書類も全て安全に管理されています。'
        : bn
        ? 'ভেবেছিলাম স্বাস্থ্যসেবায় জাপানে চাকরি পাওয়া কঠিন। Tensai-এর AI ম্যাচিং আমার জন্য সঠিক হাসপাতাল খুঁজে দিয়েছে। কাগজপত্র সব নিরাপদ।'
        : 'I thought landing a healthcare job in Japan would be near impossible. Tensai\'s AI matching found the right hospital for me and every document was handled securely.',
      flag: '🏥',
      color: 'from-rose-500/15 to-rose-600/5',
      border: 'border-rose-500/20',
    },
  ];


  /* Derive nav/footer labels from i18n */
  const navAbout  = l.about;
  const navTeam   = l.team;
  const termsText = l.terms;
  const privText  = l.privacy;

  // The intro video (Site Settings → Home Page Intro Video) lives inside the top
  // banner. With a valid link the banner becomes two columns on desktop
  // (headline left, video right); with none it stays the original centered banner.
  const hasVideo = !!getYouTubeId(settings?.intro_video_url);

  return (
    <div className="min-h-screen bg-[#0d1117] home-type">

      <SiteHeader active="home" />

      <main>

        {/* ── Hero — Centered ────────────────────────────────── */}
        <section className={`hero-mesh flex items-center px-4 pt-24 relative overflow-hidden ${hasVideo ? 'lg:min-h-screen pb-12 sm:pb-16 lg:pb-20' : 'min-h-screen pb-20'}`}>

          {/* Ambient orbs */}
          <div className="absolute top-[15%] left-[10%]  w-[500px] h-[500px] bg-green-600/10  rounded-full blur-[160px] pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-[15%] right-[8%]  w-[400px] h-[400px] bg-cyan-500/7   rounded-full blur-[130px] pointer-events-none" aria-hidden="true" />
          <div className="absolute top-[55%] left-[45%]  w-[320px] h-[320px] bg-violet-600/5  rounded-full blur-[110px] pointer-events-none" aria-hidden="true" />

          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.018] pointer-events-none"
            aria-hidden="true"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
              backgroundSize: '70px 70px',
            }}
          />

          <div className={`relative z-10 w-full animate-fade-up ${hasVideo ? 'max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center' : 'max-w-4xl mx-auto text-center'}`}>

            <div className={hasVideo ? 'text-center lg:text-left' : undefined}>

            {/* Live badge */}
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" aria-hidden="true" />
              {l.badge}
            </div>

            {/* Headline */}
            <h1 className={`text-fluid-hero-xl font-extrabold text-white max-w-4xl mx-auto ${hasVideo ? 'mb-8 lg:mx-0' : 'mb-10'}`}>
              {l.heroSub}
            </h1>

            {/* CTA */}
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm mx-auto sm:max-w-none ${hasVideo ? 'mb-8 lg:justify-start lg:mx-0' : 'mb-14'}`}>
              <Link
                href="/auth/register?type=student"
                className="w-full sm:w-auto text-center bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-full font-semibold text-[15px] tracking-[0.01em] transition-all glow-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
              >
                {l.ctaStudent}
              </Link>
            </div>

            {/* Stats strip */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 rounded-2xl overflow-hidden border border-white/[0.08] max-w-xl mx-auto ${hasVideo ? 'lg:mx-0' : ''}`}>
              {STATS.map((s, i) => (
                <div key={i} className="px-4 sm:px-6 py-3.5 bg-white/[0.03] text-center border-r border-b border-white/[0.08] last:border-r-0 [&:nth-child(2)]:border-r-0 sm:[&:nth-child(2)]:border-r [&:nth-child(3)]:border-b-0 [&:nth-child(4)]:border-b-0 sm:border-b-0">
                  <div className="text-white font-bold text-base leading-tight tabular-nums">{s.value}</div>
                  <div className="t-caption mt-1 leading-snug">{s.label}</div>
                </div>
              ))}
            </div>

            </div>

            {/* Intro video — right column on desktop, below the buttons/stats on phones */}
            {hasVideo && (
              <div className="w-full max-w-xl lg:max-w-none mx-auto">
                <IntroVideoPlayer url={settings?.intro_video_url} />
              </div>
            )}

          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0d1117] to-transparent pointer-events-none" aria-hidden="true" />
        </section>

        {/* ── Gateway Bento Grid ─────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 py-10 sm:py-16">
          <div className="text-center mb-10">
            <p className="t-eyebrow mb-2">
              {ja ? 'ゲートウェイを選択' : bn ? 'আপনার গেটওয়ে বেছে নিন' : 'Choose Your Gateway'}
            </p>
            <h2 className="t-h2">
              {ja ? '誰のために作られたか' : bn ? 'সবার জন্য তৈরি' : 'Built for everyone in the ecosystem'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GATEWAYS.map((g) => {
              const accent = g.type === 'student' ? { border: 'border-green-500/30', top: 'from-green-500/40 to-transparent', ring: 'focus-visible:ring-green-400', iconBg: 'from-green-500/20 to-green-600/5', iconBorder: 'border-green-500/20', cta: 'text-green-400' }
                : g.type === 'agency' ? { border: 'border-cyan-500/25', top: 'from-cyan-500/35 to-transparent', ring: 'focus-visible:ring-cyan-400', iconBg: 'from-cyan-500/20 to-cyan-600/5', iconBorder: 'border-cyan-500/20', cta: 'text-cyan-400' }
                : { border: 'border-violet-500/25', top: 'from-violet-500/35 to-transparent', ring: 'focus-visible:ring-violet-400', iconBg: 'from-violet-500/20 to-violet-600/5', iconBorder: 'border-violet-500/20', cta: 'text-violet-400' };
              return (
              <Link
                key={g.type}
                href={`/auth/register?type=${g.type}`}
                className={`group rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 ${accent.ring} glass-card card-hover-glow border ${accent.border}`}
              >
                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${accent.top}`} />
                {g.tag && (
                  <span className="absolute top-3.5 right-3.5 text-[11px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                    {g.tag}
                  </span>
                )}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent.iconBg} border ${accent.iconBorder} flex items-center justify-center text-2xl`} aria-hidden="true">{g.icon}</div>
                <div>
                  <h3 className="t-card-title mb-1.5">{g.title}</h3>
                  <p className="t-body-sm">{g.desc}</p>
                </div>
                <div className={`mt-auto text-sm ${accent.cta} font-semibold flex items-center gap-1.5 group-hover:gap-2.5 transition-all`}>
                  <span>{ja ? '詳しく見る' : bn ? 'শুরু করুন' : 'Get started'}</span>
                  <span className="group-hover:translate-x-1 transition-transform inline-block" aria-hidden="true">→</span>
                </div>
              </Link>
              );
            })}
          </div>
        </section>

        {/* ── How It Works ───────────────────────────────────── */}
        <section className="bg-alt-section py-10 sm:py-16 border-t border-white/[0.05]">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="t-h2">
                {ja ? 'どのように機能するか' : bn ? 'কীভাবে কাজ করে' : 'How it works'}
              </h2>
              <p className="t-lead mt-3 max-w-xl mx-auto">
                {ja ? '3ステップで日本への道が開きます' : bn ? 'মাত্র ৩ ধাপে জাপানের পথ খুলে যায়' : 'Three clear steps from registration to Japan placement'}
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-0 md:gap-0">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.num} className="flex flex-col md:flex-col md:items-center md:flex-1 md:text-center">
                  {/* Step row: icon + content side by side on mobile */}
                  <div className="flex flex-row md:flex-col items-start md:items-center gap-4 md:gap-0 px-2">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20 flex items-center justify-center text-xl md:text-2xl" aria-hidden="true">
                        {step.icon}
                      </div>
                      <span className="text-xs text-green-400 font-black tracking-widest" aria-hidden="true">{step.num}</span>
                    </div>
                    <div className="flex-1 md:px-4 md:mt-5 pb-2 md:pb-0">
                      <h3 className="t-card-title mb-1.5">{step.title}</h3>
                      <p className="t-body-sm">{step.desc}</p>
                    </div>
                  </div>

                  {/* Connector */}
                  {i < 2 && (
                    <div className="hidden md:block step-connector mx-4 mt-7" aria-hidden="true" />
                  )}
                  {i < 2 && (
                    <div className="md:hidden w-px h-6 bg-green-500/20 ml-8 my-1" aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── Emotional Story Section ────────────────────────── */}
        <EmotionalStorySection />

        {/* ── Why Tensai ─────────────────────────────────────── */}
        <section className="py-10 sm:py-16 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="t-h2 mb-3">{l.whyTitle}</h2>
              <p className="t-lead max-w-xl mx-auto">{l.whySub}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map((f) => {
                const topLine = f.color.includes('green') ? 'from-green-500/50 to-transparent'
                  : f.color.includes('cyan') ? 'from-cyan-500/50 to-transparent'
                  : f.color.includes('violet') ? 'from-violet-500/50 to-transparent'
                  : 'from-amber-500/50 to-transparent';
                return (
                // Phone: icon beside the text (each card roughly half as tall); sm and up: stacked as before.
                <div key={f.title} className="glass-card rounded-2xl p-5 sm:p-6 flex flex-row sm:flex-col items-start gap-4 card-hover-glow transition-all duration-300 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${topLine}`} />
                  <div className={`w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-xl`} aria-hidden="true">
                    {f.icon}
                  </div>
                  <div className="flex flex-col gap-1.5 sm:gap-4 min-w-0">
                    <h3 className="t-card-title">{f.title}</h3>
                    <p className="t-body-sm">{f.desc}</p>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Gallery ────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 py-10 sm:py-16 border-t border-white/[0.05]">
          <div className="mb-8">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="t-h2">
                  {ja ? '学生ギャラリー' : bn ? 'শিক্ষার্থী গ্যালারি' : 'Student Gallery'}
                </h2>
              </div>
              <Link href="/gallery" className="text-sm font-semibold text-green-400 hover:text-green-300 transition-colors shrink-0 mt-1">
                {l.galleryViewAll}
              </Link>
            </div>
          </div>

          {galleryLoading ? (
            /* Loading skeleton — mirrors the bento layout below to avoid layout shift */
            <div className="grid grid-cols-2 sm:grid-cols-4 auto-rows-[140px] sm:auto-rows-[170px] [grid-auto-flow:dense] gap-4" role="status" aria-label={ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading gallery...'}>
              <div className="col-span-2 row-span-2 rounded-2xl bg-white/[0.04] animate-pulse" />
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : galleryError ? (
            /* Error state */
            <div className="text-center py-12">
              <div className="text-3xl mb-3" aria-hidden="true">🖼️</div>
              <p className="text-[color:var(--t-muted)] text-sm">
                {ja ? 'ギャラリーを読み込めませんでした' : bn ? 'গ্যালারি লোড করা যায়নি' : 'Could not load gallery'}
              </p>
              <Link href="/gallery" className="mt-3 inline-block text-sm text-green-400 hover:text-green-300 transition-colors">
                {l.galleryViewAll}
              </Link>
            </div>
          ) : featured.length === 0 ? null : (
            /* Real gallery images — bento layout: first item is the hero tile, rest fill in around it */
            <div className="grid grid-cols-2 sm:grid-cols-4 auto-rows-[140px] sm:auto-rows-[170px] [grid-auto-flow:dense] gap-4">
              {featured.map((item, i) => {
                const isHero = i === 0;
                return (
                  <Link
                    key={item.id}
                    href="/gallery"
                    aria-label={item.title}
                    className={`group relative rounded-2xl overflow-hidden border border-white/[0.08] hover:border-green-500/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${isHero ? 'col-span-2 row-span-2' : ''}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {item.branch && (
                      <span className="absolute top-2 right-2 z-10 text-[11px] font-semibold text-white/90 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full truncate max-w-[85%]">
                        📍 {item.branch.name}
                      </span>
                    )}
                    <div
                      className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent flex flex-col justify-end p-3 sm:p-4 transition-opacity ${isHero ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                      {isHero && item.category && (
                        <span className="self-start mb-2 text-[11px] font-bold text-green-300 bg-green-400/15 border border-green-400/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {item.category}
                        </span>
                      )}
                      <p className={`text-white font-semibold leading-tight ${isHero ? 'text-sm sm:text-base' : 'text-xs'}`}>{item.title}</p>
                      {isHero && item.description && (
                        <p className="text-white/60 text-xs mt-1 leading-snug line-clamp-2 hidden sm:block">{item.description}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

        </section>

        {/* ── Testimonials ───────────────────────────────────── */}
        <section className="bg-alt-section py-10 sm:py-16 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="t-h2">
                {ja ? '実際に変えた人たち' : bn ? 'বাস্তব মানুষ, বাস্তব সাফল্য' : 'Real people. Real results.'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {(showAllTestimonials ? TESTIMONIALS : TESTIMONIALS.slice(0, 4)).map((tm, idx) => (
                // Phone: only the first two until "Show more"; md and up: the usual grid.
                <div key={tm.name} className={`glass-card rounded-2xl p-6 gap-4 border ${tm.border} border-l-4 relative ${!showAllTestimonials && idx >= 2 ? 'hidden md:flex md:flex-col' : 'flex flex-col'} ${idx === 0 ? 'ring-1 ring-amber-500/30' : ''}`} style={{borderLeftColor: idx === 0 ? '#d97706' : 'inherit'}}>
                  <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${tm.color} rounded-t-2xl`} />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5" aria-label="5 stars">
                      {[1,2,3,4,5].map(s => <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill="#facc15" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                    </div>
                  </div>
                  <p className="t-quote flex-1">{tm.quote}</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${tm.color} border ${tm.border} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                      {tm.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] text-[color:var(--t-strong)] font-semibold truncate">{tm.name}</p>
                      <p className="t-caption truncate">{tm.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {TESTIMONIALS.length > 2 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAllTestimonials(v => !v)}
                  className="text-sm font-semibold text-green-400 hover:text-green-300 transition-colors"
                >
                  {showAllTestimonials
                    ? (ja ? '閉じる' : bn ? 'কম দেখুন' : 'Show less')
                    : (ja ? 'すべてのレビューを見る' : bn ? 'সব রিভিউ দেখুন' : 'Show more')}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Latest from Guide ──────────────────────────────── */}
        {guidePosts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-10 sm:py-16 border-t border-white/[0.05]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="t-h2">
                  {ja ? 'ガイドの最新記事' : bn ? 'গাইড থেকে সর্বশেষ' : 'Latest from our Guide'}
                </h2>
              </div>
              <Link
                href="/feed"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 font-semibold transition-colors shrink-0"
              >
                {ja ? 'すべて見る' : bn ? 'সব দেখুন' : 'See all'} →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {guidePosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/feed/${post.slug}`}
                  className="group glass-card rounded-2xl overflow-hidden border border-white/[0.08] hover:border-green-500/25 card-hover-glow transition-all flex flex-row sm:flex-col"
                >
                  {/* Phone: compact row (square thumbnail + text). sm and up: the usual stacked card. */}
                  <div className="relative w-28 aspect-square sm:w-full sm:aspect-video bg-white/[0.03] overflow-hidden shrink-0">
                    {post.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.thumbnail}
                        alt={post.title}
                        className="w-full h-full object-cover object-center group-hover:scale-[1.04] transition-transform duration-500"
                      />
                    ) : (
                      // No thumbnail on this post — a branded tile instead of a blank grey box.
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-green-600/25 via-green-900/15 to-cyan-600/15">
                        <span className="text-3xl opacity-70" aria-hidden="true">📖</span>
                        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-green-300/70">{ja ? 'ガイド' : bn ? 'গাইড' : 'Tensai Guide'}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 sm:p-4 flex flex-col flex-1 min-w-0 justify-center sm:justify-start">
                    <h3 className="text-[15px] font-semibold text-[color:var(--t-strong)] leading-snug sm:mb-2 line-clamp-3 sm:line-clamp-2 group-hover:text-green-400 transition-colors">
                      {post.title}
                    </h3>
                    <p className="hidden sm:block t-body-sm line-clamp-2 flex-1">{post.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center sm:hidden">
              <Link href="/feed" className="inline-flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 font-semibold transition-colors">
                {ja ? 'すべて見る' : bn ? 'সব দেখুন' : 'See all'} →
              </Link>
            </div>
          </section>
        )}

      </main>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section className="relative border-t border-white/[0.05] py-10 sm:py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/60 via-[#0d1117] to-cyan-950/30 pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-600/8 rounded-full blur-[80px] pointer-events-none" aria-hidden="true" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-green-600/15 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
          <div className="relative z-10">
            <h2 className="t-h2 mb-4">
              {ja ? '次は、あなたの番です' : bn ? 'পরের পদক্ষেপটা আপনার' : "Your turn to make the move"}
            </h2>
            <p className="t-lead max-w-xl mx-auto mb-8">
              {ja
                ? '日本留学を夢見る学生、学生を守りたいエージェンシー、質の高い入学者を求める学校 — Tensaiはすべての人のために構築されています。'
                : bn
                ? 'জাপান যেতে চাওয়া শিক্ষার্থী, স্টুডেন্ট রক্ষা করতে চাওয়া এজেন্সি, বা মানসম্পন্ন শিক্ষার্থী খোঁজা স্কুল — Tensai সবার জন্য।'
                : 'Whether you\'re a student dreaming of Japan, an agency protecting your students, or a school seeking quality applicants — Tensai was built for you.'}
            </p>
            <div className="flex flex-col items-center gap-5">
              <Link
                href="/auth/register"
                className="px-10 py-4 bg-green-600 hover:bg-green-500 text-white rounded-full font-semibold text-[15px] tracking-[0.01em] transition-all glow-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
              >
                {l.ctaStudent}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-8 px-4 bg-alt-section">
        <div className="max-w-7xl mx-auto">
          {/* Legal Disclaimer */}
          <div className="border border-white/[0.06] rounded-xl px-5 py-4 mb-6 text-center">
            <p className="text-xs leading-relaxed text-[color:var(--t-muted)]">
              {ja
                ? '免責事項：Tensaiはテクノロジーを活用した教育・人材マッチングインフラです。語学研修、スキルブリッジング、海外大学入学コンサルティング、および海外就労情報の提供を行っています。Tensaiはビザの直接発行、出入国管理の手続き、または労働者の海外送出を直接行いません。最終的な学生ビザ申請および雇用採用の認可は、公認大学およびバングラデシュ政府認定のBMETライセンス取得パートナー機関を通じてのみ行われます。'
                : bn
                ? 'দায়মুক্তি বিবৃতি: Tensai একটি আইটি-সক্ষম শিক্ষা ও প্রতিভা-সংযোগ অবকাঠামো। আমরা ভাষা প্রশিক্ষণ, দক্ষতা উন্নয়ন, আন্তর্জাতিক শিক্ষার্থী ভর্তি পরামর্শ এবং বৈশ্বিক কর্মসংস্থানের তথ্য সরবরাহ করি। Tensai সরাসরি ভিসা প্রদান, অভিবাসন প্রক্রিয়াকরণ বা জনশক্তি রপ্তানি করে না। সকল চূড়ান্ত শিক্ষার্থী ভিসা আবেদন এবং কর্মসংস্থান নিয়োগ অনুমোদন সরকারিভাবে স্বীকৃত বিশ্ববিদ্যালয় এবং বাংলাদেশে সরকার-অনুমোদিত BMET লাইসেন্সপ্রাপ্ত অংশীদার সংস্থাগুলির মাধ্যমে পরিচালিত হয়।'
                : 'Disclaimer: Tensai is an IT-enabled educational and talent-matching infrastructure. We provide language training, skill-bridging, international student admission consultancy, and global employment information. Tensai does not directly issue visas, process immigration, or export manpower. All final student visa applications and employment recruitment clearances are handled strictly through officially recognized universities and government-approved BMET licensed partner agencies in Bangladesh.'}
            </p>
          </div>

          <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Image src="/tensai-logo.png" alt="Tensai" width={30} height={30} className="rounded-full object-contain" />
              <span className="text-sm font-bold text-white/80">Tensai</span>
            </Link>
            <nav aria-label={ja ? 'フッターナビゲーション' : bn ? 'ফুটার নেভিগেশন' : 'Footer navigation'}>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[color:var(--t-muted)]">
                <Link href="/about"    className="hover:text-[color:var(--t-strong)] transition-colors">{navAbout}</Link>
                <Link href="/team"     className="hover:text-[color:var(--t-strong)] transition-colors">{navTeam}</Link>
                <Link href="/gallery"  className="hover:text-[color:var(--t-strong)] transition-colors">{l.gallery}</Link>
                <Link href="/branches" className="hover:text-[color:var(--t-strong)] transition-colors">{ja ? '支局' : bn ? 'শাখা' : 'Branches'}</Link>
                <Link href="/contact"  className="hover:text-[color:var(--t-strong)] transition-colors">{ja ? 'お問い合わせ' : bn ? 'যোগাযোগ' : 'Contact'}</Link>
                <Link href="/auth/register?type=affiliate" className="hover:text-[color:var(--t-strong)] transition-colors">{l.gateways.affiliateTitle}</Link>
                <span className="text-white/[0.12]">·</span>
                <Link href="/auth/register?type=agency"      className="hover:text-[color:var(--t-strong)] transition-colors">{l.ctaAgency}</Link>
                <Link href="/auth/register?type=institution" className="hover:text-[color:var(--t-strong)] transition-colors">{l.ctaInstitution}</Link>
                <span className="text-white/[0.12]">·</span>
                <Link href="/terms"    className="hover:text-[color:var(--t-strong)] transition-colors">{termsText}</Link>
                <Link href="/privacy"  className="hover:text-[color:var(--t-strong)] transition-colors">{privText}</Link>
              </div>
            </nav>
            <div className="flex flex-col items-center sm:items-end gap-2">
              <div className="flex items-center gap-2 flex-wrap justify-center">
              {/* Social icons — only render if URL exists in settings */}
              {settings?.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              )}
              {settings?.youtube_url && (
                <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#0d1117"/>
                  </svg>
                </a>
              )}
              {settings?.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
              )}
              {settings?.tiktok_url && (
                <a href={settings.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>
                </a>
              )}
              {settings?.linkedin_url && (
                <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
              )}
              {settings?.twitter_url && (
                <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" aria-label="X / Twitter"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              )}
              </div>
              <p className="text-xs text-[color:var(--t-muted)] text-center sm:text-right">
                {ja ? (settings?.copyright_ja || '© 2026 Tensai Consultancy Ltd.') : bn ? (settings?.copyright_bn || '© 2026 তেনসাই কনসালটেন্সি লিমিটেড।') : (settings?.copyright_en || '© 2026 Tensai Consultancy Ltd. All rights reserved.')}
              </p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
