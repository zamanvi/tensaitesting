'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface SiteSettings {
  support_whatsapp?: string;
  support_phone?: string;
  support_email?: string;
  office_address?: string;
}

export default function AboutPage() {
  const { t, lang, toggle } = useLang();
  const l = t.landing;
  const a = t.about;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ['public-settings'],
    queryFn: () => api.get('/settings/public').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const STATS = [
    { value: '4',       label: a.stat1 },
    { value: '100%',    label: a.stat2 },
    { value: '0',       label: a.stat3 },
    { value: 'BD→JP',   label: a.stat4, small: true },
    { value: '৳20K',    label: ja ? '紹介1件の収益' : bn ? 'প্রতি রেফারেলে আয়' : 'Per Referral Earned' },
    { value: '2026',    label: ja ? '正式ローンチ' : bn ? 'আনুষ্ঠানিক লঞ্চ' : 'Official Launch' },
  ];

  const PROBLEMS = [
    ja ? '偽の書類が検出されずに通過する' : bn ? 'ভুয়া কাগজ ধরা পড়ে না' : 'Fake documents pass undetected',
    ja ? 'エージェンシーが費用を取って消える' : bn ? 'এজেন্সি ফি নিয়ে উধাও হয়' : 'Agencies take fees and disappear',
    ja ? '学生には証拠も救済手段もない' : bn ? 'শিক্ষার্থীর হাতে কোনো প্রমাণ বা প্রতিকার নেই' : 'Students have no proof and no recourse',
    ja ? '教育機関は学生の信頼性を確認できない' : bn ? 'প্রতিষ্ঠান শিক্ষার্থীর বিশ্বাসযোগ্যতা যাচাই করতে পারে না' : "Institutions can't verify student credibility",
  ];

  const SOLUTIONS = [
    ja ? 'OCR＋AIがすべての書類をプロフィールにロック' : bn ? 'OCR+AI সব কাগজ প্রোফাইলে লক করে — চিরতরে' : 'OCR + AI locks every document to the profile permanently',
    ja ? 'エスクローがマイルストーンまで資金を保護' : bn ? 'এস্ক্রো মাইলস্টোন পর্যন্ত পেমেন্ট সুরক্ষিত রাখে' : 'Escrow protects every payment until milestones are met',
    ja ? 'すべてのステップが正式に記録・監査可能' : bn ? 'প্রতিটি ধাপ আনুষ্ঠানিকভাবে রেকর্ড ও যাচাইযোগ্য' : 'Every step formally recorded and permanently auditable',
    ja ? '認証済みプロフィール — 永久改ざん不可' : bn ? 'যাচাইকৃত প্রোফাইল — পরিবর্তন অসম্ভব' : 'Verified student profiles — tamper-proof forever',
  ];

  const PILLARS = [
    { icon: '🔒', title: a.p1Title, desc: a.p1Desc, color: 'from-green-500/15 to-green-600/5'   },
    { icon: '🤖', title: a.p2Title, desc: a.p2Desc, color: 'from-cyan-500/15 to-cyan-600/5'     },
    { icon: '🤝', title: a.p3Title, desc: a.p3Desc, color: 'from-violet-500/15 to-violet-600/5' },
    { icon: '🛡️', title: a.p4Title, desc: a.p4Desc, color: 'from-amber-500/15 to-amber-600/5'  },
  ];

  const GATEWAYS = [
    {
      icon: '🎓',
      href: '/auth/register?type=student',
      color: 'from-green-500/10 to-green-600/5',
      accent: 'border-green-200 hover:border-green-400 hover:shadow-green-100',
      badge: 'bg-green-50 text-green-700 border border-green-200',
      title: ja ? '学生' : bn ? 'শিক্ষার্থী' : 'Students',
      sub: ja ? 'あなたの書類が証明する' : bn ? 'আপনার কাগজই প্রমাণ' : 'Your documents speak for you',
      points: ja
        ? ['AIが書類をスキャン・認証', 'プロフィールがロック — 改ざん不可', '認定機関に直接接続', 'AI適格性スコアリング']
        : bn
        ? ['AI কাগজ স্ক্যান ও যাচাই করে', 'প্রোফাইল লক — পরিবর্তন অসম্ভব', 'স্বীকৃত প্রতিষ্ঠানে সরাসরি সংযুক্ত', 'AI যোগ্যতা স্কোরিং']
        : ['AI scans & verifies your documents', 'Profile locks — tamper-proof', 'Connected to accredited institutions', 'AI eligibility scoring'],
    },
    {
      icon: '🏢',
      href: '/auth/register?type=agency',
      color: 'from-blue-500/10 to-blue-600/5',
      accent: 'border-blue-200 hover:border-blue-400 hover:shadow-blue-100',
      badge: 'bg-blue-50 text-blue-700 border border-blue-200',
      title: ja ? 'エージェンシー' : bn ? 'এজেন্সি' : 'Agencies',
      sub: ja ? 'リードを管理し、収益を最大化' : bn ? 'লিড ম্যানেজ করুন, আয় বাড়ান' : 'Manage leads, maximise earnings',
      points: ja
        ? ['プライベート保管庫でリード管理', '処理できないリードをB2B共有', 'エスクロー保護の収益', 'フランチャイズネットワーク']
        : bn
        ? ['প্রাইভেট ভল্টে লিড ম্যানেজমেন্ট', 'B2B লিড শেয়ারিং — কোনো অপচয় নেই', 'এস্ক্রো-সুরক্ষিত আয়', 'ফ্র্যাঞ্চাইজি নেটওয়ার্ক']
        : ['Manage leads in a private vault', 'B2B lead sharing — zero waste', 'Escrow-protected earnings', 'Franchise network access'],
    },
    {
      icon: '🏫',
      href: '/auth/register?type=institution',
      color: 'from-violet-500/10 to-violet-600/5',
      accent: 'border-violet-200 hover:border-violet-400 hover:shadow-violet-100',
      badge: 'bg-violet-50 text-violet-700 border border-violet-200',
      title: ja ? '教育機関' : bn ? 'শিক্ষাপ্রতিষ্ঠান' : 'Institutions',
      sub: ja ? '本物の学生だけを見る' : bn ? 'শুধু সত্যিকারের শিক্ষার্থী দেখুন' : 'See only verified, real students',
      points: ja
        ? ['認証済み学生プロフィールを閲覧', 'JLPT・GPA・年齢でフィルタリング', '連絡は常にTensai経由', '学生の個人情報は非表示']
        : bn
        ? ['যাচাইকৃত শিক্ষার্থী প্রোফাইল ব্রাউজ', 'JLPT, GPA, বয়স দিয়ে ফিল্টার', 'যোগাযোগ সবসময় টেনসাইয়ের মাধ্যমে', 'শিক্ষার্থীর ব্যক্তিগত তথ্য গোপন']
        : ['Browse verified student profiles', 'Filter by JLPT, GPA, age', 'All contact via Tensai only', 'Student privacy always protected'],
    },
    {
      icon: '💼',
      href: '/auth/register?type=affiliate',
      color: 'from-amber-500/10 to-amber-600/5',
      accent: 'border-amber-200 hover:border-amber-400 hover:shadow-amber-100',
      badge: 'bg-amber-50 text-amber-700 border border-amber-200',
      title: ja ? 'アフィリエイト' : bn ? 'অ্যাফিলিয়েট' : 'Affiliates',
      sub: ja ? '紹介で収益を得る' : bn ? 'রেফার করুন, আয় করুন' : 'Refer people, earn commission',
      points: ja
        ? ['学生または機関を紹介', '成功紹介1件あたり৳20,000', '収益をダッシュボードで追跡', '特別スキルは不要']
        : bn
        ? ['শিক্ষার্থী বা প্রতিষ্ঠান রেফার করুন', 'প্রতি সফল রেফারেলে ৳২০,০০০', 'ড্যাশবোর্ডে আয় ট্র্যাক করুন', 'কোনো বিশেষ দক্ষতা লাগে না']
        : ['Refer students or institutions', '৳20,000 per successful referral', 'Track earnings on your dashboard', 'No special skills required'],
    },
  ];

  const CORRIDORS = [
    {
      from: '🇧🇩', to: '🇯🇵',
      route: 'BD → Japan',
      status: 'live',
      label: ja ? 'ライブ稼働中' : bn ? 'সক্রিয়' : 'Live Now',
      desc: ja ? '認証済み学生が今すぐ日本の大学・専門学校に接続可能。' : bn ? 'যাচাইকৃত শিক্ষার্থীরা এখনই জাপানের বিশ্ববিদ্যালয়ে আবেদন করতে পারছেন।' : 'Verified students can connect to Japanese universities and vocational schools right now.',
    },
    {
      from: '🇧🇩', to: '🇰🇷',
      route: 'BD → South Korea',
      status: 'coming',
      label: ja ? '近日公開' : bn ? 'শীঘ্রই আসছে' : 'Coming Soon',
      desc: ja ? '韓国の大学・語学学校との提携を構築中。2026年後半予定。' : bn ? 'কোরিয়ার বিশ্ববিদ্যালয় ও ভাষা স্কুলের সাথে চুক্তি তৈরি হচ্ছে।' : 'Partnerships with Korean universities and language schools in progress.',
    },
    {
      from: '🇧🇩', to: '🇩🇪',
      route: 'BD → Germany',
      status: 'planned',
      label: ja ? '計画中' : bn ? 'পরিকল্পিত' : 'Planned',
      desc: ja ? 'ドイツの工科大学・職業訓練校との連携を計画中。' : bn ? 'জার্মানির প্রযুক্তি বিশ্ববিদ্যালয় ও ভোকেশনাল স্কুলের সাথে পরিকল্পনা চলছে।' : 'Planning partnerships with German technical universities and vocational programs.',
    },
    {
      from: '🌏', to: '🌐',
      route: ja ? 'さらに多くへ' : bn ? 'আরও দেশে' : 'And beyond…',
      status: 'future',
      label: ja ? '将来' : bn ? 'ভবিষ্যতে' : 'Future',
      desc: ja ? 'Tensaiは世界中の教育機関との接続を目指す、グローバルインフラです。' : bn ? 'টেনসাই একটি বৈশ্বিক অবকাঠামো — বিশ্বের সব শিক্ষাপ্রতিষ্ঠানের সাথে সংযুক্ত হওয়ার লক্ষ্যে।' : 'Tensai is global infrastructure — the goal is connecting every qualified student to every great institution.',
    },
  ];

  const TEAM = [
    {
      name: 'Md. Norozzaman',
      initials: 'MN',
      role: a.role1,
      bio: a.bio1,
      badge: a.badge1,
      photo: 'https://pub-f01f8a3511524b808cb8116aa5d495aa.r2.dev/ceo.webp',
      avatarBg: 'bg-green-700',
      linkedin: 'https://linkedin.com/in/md-norozzaman-207418169/',
      accent: 'border-green-200 hover:border-green-400',
      badgeColor: 'bg-green-50 text-green-700 border border-green-200',
    },
    {
      name: 'Nasir Sarker',
      initials: 'NS',
      role: a.role2,
      bio: a.bio2,
      badge: a.badge2,
      photo: 'https://pub-f01f8a3511524b808cb8116aa5d495aa.r2.dev/2.png',
      avatarBg: 'bg-slate-700',
      linkedin: null,
      accent: 'border-slate-200 hover:border-slate-400',
      badgeColor: 'bg-slate-50 text-slate-600 border border-slate-200',
    },
    {
      name: 'Sabbir',
      initials: 'SB',
      role: a.role3,
      bio: a.bio3,
      badge: a.badge3,
      photo: 'https://pub-f01f8a3511524b808cb8116aa5d495aa.r2.dev/WhatsApp%20Image%202026-06-06%20at%209.06.32%20PM.jpeg',
      avatarBg: 'bg-blue-700',
      linkedin: null,
      accent: 'border-blue-200 hover:border-blue-400',
      badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200',
    },
    {
      name: 'Amir Hossain',
      initials: 'AH',
      role: a.role4,
      bio: a.bio4,
      badge: a.badge4,
      photo: 'https://pub-f01f8a3511524b808cb8116aa5d495aa.r2.dev/amir%20vai.png',
      avatarBg: 'bg-orange-700',
      linkedin: null,
      accent: 'border-orange-200 hover:border-orange-400',
      badgeColor: 'bg-orange-50 text-orange-700 border border-orange-200',
    },
  ];

  const termsText = l.terms;
  const privText  = l.privacy;
  const toggleLabel     = lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English';
  const toggleAriaLabel = lang === 'en' ? 'Switch to Bangla' : lang === 'bn' ? '日本語に切り替える' : 'Switch to English';

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav
        aria-label={ja ? 'メインナビゲーション' : bn ? 'প্রধান নেভিগেশন' : 'Main navigation'}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/tensai-logo.png" alt="Tensai" width={36} height={36} className="rounded-full object-contain" priority />
            <div>
              <div className="text-base font-bold text-slate-900 tracking-tight leading-none">Tensai</div>
              <div className="text-[9px] text-slate-400 tracking-wider leading-none mt-0.5 hidden sm:block">
                {ja ? 'グローバルキャリアへの道' : bn ? 'বৈশ্বিক ক্যারিয়ারের পথ' : 'THE WAY OF GLOBAL CAREER'}
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggle}
              aria-label={toggleAriaLabel}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-green-400 hover:text-green-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              {toggleLabel}
            </button>
            <Link href="/about"    className="text-sm font-semibold text-green-700 px-2 py-1 hidden md:inline border-b-2 border-green-600">{a.navAbout}</Link>
            <Link href="/team"     className="text-sm text-slate-500 hover:text-slate-900 transition-colors px-2 py-1 hidden md:inline">{a.navTeam}</Link>
            <Link href="/gallery"  className="text-sm text-slate-500 hover:text-slate-900 transition-colors px-2 py-1 hidden md:inline">{a.navGallery}</Link>
            <Link href="/branches" className="text-sm text-slate-500 hover:text-slate-900 transition-colors px-2 py-1 hidden md:inline">{ja ? '支局' : bn ? 'শাখা' : 'Branches'}</Link>
            <Link href="/auth/login" className="text-sm text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5 hidden sm:inline">{l.login}</Link>
            <Link href="/auth/register" className="text-sm bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-full font-semibold transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 hidden sm:inline">
              {l.getStarted}
            </Link>
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
              aria-label="Menu"
            >
              {mobileOpen
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              }
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-4 flex flex-col gap-1 shadow-lg">
            <Link href="/about"    onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-green-700 px-3 py-2.5 rounded-xl bg-green-50">{a.navAbout}</Link>
            <Link href="/team"     onClick={() => setMobileOpen(false)} className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all">{a.navTeam}</Link>
            <Link href="/gallery"  onClick={() => setMobileOpen(false)} className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all">{a.navGallery}</Link>
            <Link href="/branches" onClick={() => setMobileOpen(false)} className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all">{ja ? '支局' : bn ? 'শাখা' : 'Branches'}</Link>
            <div className="border-t border-slate-100 mt-2 pt-3 flex gap-2">
              <Link href="/auth/login"    onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-full transition-all">{l.login}</Link>
              <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm bg-green-700 hover:bg-green-600 text-white px-4 py-2.5 rounded-full font-semibold transition-all">{l.getStarted}</Link>
            </div>
          </div>
        )}
      </nav>

      <main>

        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-32 pb-20 px-4 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-green-50/80 via-white to-white pointer-events-none" aria-hidden="true" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-green-400/8 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            aria-hidden="true"
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.8) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-700/8 border border-green-700/15 text-green-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse shrink-0" aria-hidden="true" />
              {a.badge}
            </div>
            <h1 className="text-fluid-hero font-black text-slate-900 leading-[1.06] tracking-tight mb-5">
              {a.heroTitle}<br />
              <span className="text-green-700">{a.heroHighlight}</span>
            </h1>
            <p className="text-fluid-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-8">
              {a.heroDesc}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/auth/register" className="bg-green-700 hover:bg-green-600 text-white px-8 py-3.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-green-700/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">
                {a.ctaStart}
              </Link>
              <Link href="#problem" className="border border-slate-200 hover:border-green-400 text-slate-700 hover:text-green-800 px-8 py-3.5 rounded-full font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400">
                {ja ? '問題を見る ↓' : bn ? 'সমস্যাটি দেখুন ↓' : 'See the problem ↓'}
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats Strip ────────────────────────────────────── */}
        <section className="py-12 px-4 border-y border-slate-100 bg-slate-50/60" aria-label={ja ? '主な数値' : bn ? 'মূল পরিসংখ্যান' : 'Key statistics'}>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {STATS.map((s, i) => (
                <div key={i} className="bg-white px-4 py-6 text-center">
                  <div className={`font-black text-green-700 leading-none mb-1 ${s.small ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>{s.value}</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 leading-snug mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── The Problem ────────────────────────────────────── */}
        <section id="problem" className="bg-slate-900 py-16 sm:py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-slate-900 to-slate-900 pointer-events-none" aria-hidden="true" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-green-600/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
                {ja ? '⚠️ 現状の問題' : bn ? '⚠️ বিদ্যমান সমস্যা' : '⚠️ The Problem'}
              </div>
              <h2 className="text-fluid-4xl font-bold text-white mb-3">
                {ja ? '留学業界は壊れている' : bn ? 'বিদেশে পড়াশোনার শিল্প ভাঙা' : 'The study-abroad industry is broken'}
              </h2>
              <p className="text-slate-400 text-sm max-w-lg mx-auto">
                {ja ? 'Tensaiが生まれた理由を正直に話す。' : bn ? 'কেন টেনসাই তৈরি হয়েছে সেটা সরাসরি বলি।' : "Here's why we built Tensai — and why it had to be built."}
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Before */}
              <div className="bg-white/[0.03] border border-red-500/15 rounded-2xl p-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center text-red-400 text-sm font-black">✕</div>
                  <h3 className="font-bold text-white text-sm">
                    {ja ? '今まで' : bn ? 'এতদিন ছিল' : 'The old way'}
                  </h3>
                </div>
                <div className="space-y-4">
                  {PROBLEMS.map((p, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400 text-[10px] font-black mt-0.5">✕</span>
                      <p className="text-slate-400 text-sm leading-relaxed">{p}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* After */}
              <div className="bg-white/[0.03] border border-green-500/20 rounded-2xl p-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center text-green-400 text-sm font-black">✓</div>
                  <h3 className="font-bold text-white text-sm">
                    {ja ? 'Tensaiの解決策' : bn ? 'টেনসাইয়ের সমাধান' : 'The Tensai way'}
                  </h3>
                </div>
                <div className="space-y-4">
                  {SOLUTIONS.map((s, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center text-green-400 text-[10px] font-black mt-0.5">✓</span>
                      <p className="text-slate-300 text-sm leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Our Story ──────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 py-16 sm:py-20">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              {a.storyBadge}
            </div>
            <h2 className="text-fluid-4xl font-bold text-slate-900 mb-2">{a.storyTitle}</h2>
          </div>
          <div className="space-y-5 text-slate-600 text-fluid-base leading-relaxed">
            <p>{a.story1}</p>
            <blockquote className="border-l-4 border-green-500 pl-5 py-1 my-6">
              <p className="text-slate-800 font-semibold text-fluid-lg leading-snug italic">
                {ja
                  ? '"書類の真偽を証明できない学生が、なぜ機会を失わなければならないのか？"'
                  : bn
                  ? '"যে শিক্ষার্থী তার কাগজের সত্যতা প্রমাণ করতে পারে না, সে কেন সুযোগ হারাবে?"'
                  : '"Why should a student lose their chance because they can\'t prove their own documents are real?"'}
              </p>
              <footer className="text-sm text-slate-400 mt-2 not-italic">— Md. Norozzaman, Founder</footer>
            </blockquote>
            <p>{a.story2}</p>
            <p>{a.story3}</p>
          </div>
        </section>

        {/* ── What We Stand For ──────────────────────────────── */}
        <section className="bg-slate-50 py-16 sm:py-20 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-slate-400 text-[11px] font-semibold tracking-[0.3em] uppercase mb-2">
                {ja ? '私たちの価値観' : bn ? 'আমাদের মূলনীতি' : 'Core Principles'}
              </p>
              <h2 className="text-fluid-4xl font-bold text-slate-900">{a.pillarsTitle}</h2>
              <p className="text-slate-400 text-sm mt-2">{a.pillarsSub}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PILLARS.map((p) => (
                <div key={p.title} className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-green-200 hover:shadow-md transition-all flex flex-col gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-2xl border border-slate-100`} aria-hidden="true">
                    {p.icon}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{p.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Who Tensai Serves ──────────────────────────────── */}
        <section className="py-16 sm:py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-slate-400 text-[11px] font-semibold tracking-[0.3em] uppercase mb-2">
                {ja ? 'エコシステム' : bn ? 'ইকোসিস্টেম' : 'Ecosystem'}
              </p>
              <h2 className="text-fluid-4xl font-bold text-slate-900">
                {ja ? 'Tensaiは4種類のユーザーに対応' : bn ? 'টেনসাই চার ধরনের ব্যবহারকারী সেবা দেয়' : 'Built for four types of users'}
              </h2>
              <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
                {ja ? '学生・エージェンシー・教育機関・アフィリエイト — 全員が同じプラットフォームで繋がる。' : bn ? 'শিক্ষার্থী, এজেন্সি, প্রতিষ্ঠান ও অ্যাফিলিয়েট — সবাই একই প্ল্যাটফর্মে সংযুক্ত।' : 'Students, agencies, institutions, and affiliates — all connected in one trusted ecosystem.'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {GATEWAYS.map((g) => (
                <div key={g.title} className={`bg-white border rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg transition-all ${g.accent}`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center text-2xl`} aria-hidden="true">
                    {g.icon}
                  </div>
                  <div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${g.badge}`}>{g.title}</span>
                    <p className="text-xs text-slate-400 mt-2 font-medium">{g.sub}</p>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {g.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                        <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                  <Link href={g.href} className="mt-auto text-xs font-semibold text-green-700 hover:text-green-600 hover:underline transition-colors">
                    {ja ? '今すぐ始める →' : bn ? 'শুরু করুন →' : 'Get started →'}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Corridors Roadmap ──────────────────────────────── */}
        <section className="bg-slate-50 py-16 sm:py-20 border-t border-slate-100 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-slate-400 text-[11px] font-semibold tracking-[0.3em] uppercase mb-2">
                {ja ? 'グローバル展開' : bn ? 'বৈশ্বিক বিস্তার' : 'Global Expansion'}
              </p>
              <h2 className="text-fluid-4xl font-bold text-slate-900">
                {ja ? '今と、その先へ' : bn ? 'এখন এবং সামনে' : 'Where we are, and where we\'re going'}
              </h2>
              <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
                {ja ? 'バングラデシュから始まり、世界へ広がるTensaiのコリドーマップ。' : bn ? 'বাংলাদেশ থেকে শুরু হয়ে বিশ্বে ছড়িয়ে পড়ছে টেনসাই।' : 'Starting from Bangladesh, expanding to every major study destination globally.'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {CORRIDORS.map((c) => (
                <div key={c.route} className={`bg-white rounded-2xl p-6 border flex flex-col gap-4 transition-all ${
                  c.status === 'live'    ? 'border-green-200 shadow-sm shadow-green-100' :
                  c.status === 'coming' ? 'border-blue-100'  :
                  c.status === 'planned'? 'border-slate-100' : 'border-dashed border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 text-3xl">
                    <span>{c.from}</span>
                    <span className="text-slate-300 text-sm">→</span>
                    <span>{c.to}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{c.route}</p>
                    <span className={`inline-block mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      c.status === 'live'    ? 'bg-green-100 text-green-700' :
                      c.status === 'coming' ? 'bg-blue-100 text-blue-600'   :
                      c.status === 'planned'? 'bg-slate-100 text-slate-500'  : 'bg-slate-50 text-slate-400'
                    }`}>
                      {c.status === 'live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1 align-middle" />}
                      {c.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed flex-1">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Team ───────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 border-t border-slate-100 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-slate-400 text-[11px] font-semibold tracking-[0.3em] uppercase mb-2">
                {ja ? 'チーム' : bn ? 'আমাদের দল' : 'Our Team'}
              </p>
              <h2 className="text-fluid-4xl font-bold text-slate-900">{a.teamTitle}</h2>
              <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">{a.teamSub}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {TEAM.map((member) => (
                <div key={member.name} className={`bg-white border rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg transition-all ${member.accent}`}>
                  <div className="flex items-center gap-3">
                    {member.photo ? (
                      <Image
                        src={member.photo}
                        alt={member.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-xl object-cover object-top shrink-0 shadow-sm"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-xl ${member.avatarBg} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`} aria-hidden="true">
                        {member.initials}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-900 text-sm leading-tight">{member.name}</div>
                      <div className="text-xs text-green-700 font-medium mt-0.5">{member.role}</div>
                    </div>
                  </div>
                  <span className={`self-start text-[11px] font-semibold px-2.5 py-1 rounded-full ${member.badgeColor}`}>
                    {member.badge}
                  </span>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1">{member.bio}</p>
                  <div className="flex items-center justify-between mt-auto">
                    {member.linkedin ? (
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded">
                        LinkedIn →
                      </a>
                    ) : (
                      <Link href="/team" className="text-xs text-slate-400 hover:text-green-700 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded">
                        {ja ? '詳細を見る →' : bn ? 'আরও দেখুন →' : 'Full profile →'}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/team" className="inline-flex items-center gap-2 border border-slate-200 hover:border-green-400 text-slate-700 hover:text-green-800 px-6 py-2.5 rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400">
                {ja ? 'チームページを見る →' : bn ? 'পুরো দল দেখুন →' : 'Meet the full team →'}
              </Link>
            </div>
          </div>
        </section>

        {/* ── Contact Info ───────────────────────────────────── */}
        {(settings?.support_phone || settings?.support_email || settings?.support_whatsapp || settings?.office_address) && (
          <section className="py-12 sm:py-16 px-4 bg-slate-50 border-t border-slate-100">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {ja ? 'お問い合わせ' : bn ? 'যোগাযোগ করুন' : 'Get in Touch'}
              </h2>
              <p className="text-slate-500 text-sm mb-8">
                {ja ? 'ご質問やご相談はお気軽にどうぞ。' : bn ? 'যেকোনো প্রশ্ন বা পরামর্শের জন্য আমাদের সাথে যোগাযোগ করুন।' : "Have questions? We're here to help."}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {settings?.support_phone && (
                  <a href={`tel:${settings.support_phone}`} className="flex items-center gap-2.5 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-700 hover:border-green-300 hover:bg-green-50 transition-all">
                    <span>📞</span><span>{settings.support_phone}</span>
                  </a>
                )}
                {settings?.support_whatsapp && (
                  <a href={`https://wa.me/${settings.support_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-5 py-3 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-700 hover:bg-green-100 transition-all">
                    <span>💬</span><span>WhatsApp</span>
                  </a>
                )}
                {settings?.support_email && (
                  <a href={`mailto:${settings.support_email}`} className="flex items-center gap-2.5 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-700 hover:border-green-300 hover:bg-green-50 transition-all">
                    <span>✉️</span><span>{settings.support_email}</span>
                  </a>
                )}
                {settings?.office_address && (
                  <div className="flex items-center gap-2.5 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-700">
                    <span>📍</span><span>{settings.office_address}</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ────────────────────────────────────────────── */}
        <section className="bg-slate-900 py-16 sm:py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 via-transparent to-slate-900 pointer-events-none" aria-hidden="true" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-green-600/10 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <div className="text-4xl mb-5" aria-hidden="true">🚀</div>
            <h2 className="text-fluid-4xl font-bold text-white mb-4">
              {ja ? 'グローバルキャリアへの道を、今。' : bn ? 'আপনার বৈশ্বিক ক্যারিয়ার শুরু হোক এখানে।' : 'Your global career starts here.'}
            </h2>
            <p className="text-slate-400 text-fluid-base mb-8 leading-relaxed max-w-lg mx-auto">
              {ja ? '学生・エージェンシー・教育機関・アフィリエイト — 天才はあなたのために作られています。' : bn ? 'শিক্ষার্থী, এজেন্সি, বিশ্ববিদ্যালয় বা অ্যাফিলিয়েট — টেনসাই আপনার জন্যই তৈরি।' : 'Student, agency, university, or affiliate — Tensai was built for you. Join the ecosystem that puts trust first.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
              <Link href="/auth/register?type=student" className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white px-7 py-3.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-green-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300">
                {ja ? '学生として始める' : bn ? 'শিক্ষার্থী হিসেবে শুরু করুন' : 'Start as Student'}
              </Link>
              <Link href="/auth/register?type=agency" className="w-full sm:w-auto border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-white px-7 py-3.5 rounded-full font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
                {ja ? 'エージェンシーとして参加' : bn ? 'এজেন্সি হিসেবে যোগ দিন' : 'Join as Agency'}
              </Link>
              <Link href="/auth/register?type=affiliate" className="w-full sm:w-auto border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-white px-7 py-3.5 rounded-full font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
                {ja ? 'アフィリエイトとして参加' : bn ? 'অ্যাফিলিয়েট হিসেবে যোগ দিন' : 'Join as Affiliate'}
              </Link>
            </div>
            <div className="mt-4">
              <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                {ja ? '← ホームに戻る' : bn ? '← হোমে ফিরুন' : '← Back to Home'}
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/tensai-logo.png" alt="Tensai" width={26} height={26} className="rounded-full object-contain opacity-70" />
            <span className="text-sm font-bold text-slate-500">Tensai</span>
          </Link>
          <nav aria-label={ja ? 'フッターナビゲーション' : bn ? 'ফুটার নেভিগেশন' : 'Footer navigation'}>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
              <Link href="/about"   className="text-green-700 font-medium">{a.navAbout}</Link>
              <Link href="/team"    className="hover:text-slate-700 transition-colors">{a.navTeam}</Link>
              <Link href="/gallery" className="hover:text-slate-700 transition-colors">{a.navGallery}</Link>
              <Link href="/terms"   className="hover:text-slate-700 transition-colors">{termsText}</Link>
              <Link href="/privacy" className="hover:text-slate-700 transition-colors">{privText}</Link>
            </div>
          </nav>
          <p className="text-xs text-slate-400">{l.footer}</p>
        </div>
      </footer>

    </div>
  );
}
