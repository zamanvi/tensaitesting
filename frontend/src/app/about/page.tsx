'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  const { t, lang, toggle } = useLang();
  const l = t.landing;
  const ja = lang === 'ja';

  const STATS = [
    { value: '4', label: ja ? 'ユーザーゲートウェイ' : 'User Gateways' },
    { value: '100%', label: ja ? '書類OCR認証' : 'OCR-Verified Docs' },
    { value: '0', label: ja ? '偽プロフィール' : 'Fake Profiles' },
    { value: 'BD→JP', label: ja ? '最初の留学ルート' : 'First Corridor' },
  ];

  const PILLARS = [
    {
      icon: '🔒',
      title: ja ? '完全な透明性' : 'Full Transparency',
      desc: ja ? 'すべての書類・ステップ・決定が記録・監査可能。' : 'Every document, step, and decision is recorded and auditable. Nothing hidden.',
    },
    {
      icon: '🤖',
      title: ja ? 'AI認証' : 'AI Verification',
      desc: ja ? 'OCRが書類を自動スキャン。AIが各国への適格性をスコアリング。' : 'OCR auto-scans documents. AI scores student eligibility for each destination.',
    },
    {
      icon: '🤝',
      title: ja ? 'B2B協業' : 'B2B Collaboration',
      desc: ja ? 'エージェンシーが競合せず協力。リードを共有して全員が収益を得る。' : 'Agencies collaborate instead of compete. Share leads — everyone earns more.',
    },
    {
      icon: '🛡️',
      title: ja ? 'プライバシー最優先' : 'Privacy First',
      desc: ja ? '学生の連絡先は常にマスク。教育機関には資格情報のみ表示。' : 'Student contact info always masked. Institutions see qualifications only.',
    },
  ];

  const HOW = [
    {
      step: '01',
      icon: '🎓',
      title: ja ? '学生が登録' : 'Student Signs Up',
      desc: ja
        ? 'AIがパスポートと書類をスキャン・認証。一度認証されたプロフィールはロックされ改ざん不可。'
        : 'AI scans and verifies documents instantly. Profile locks after verification — tamper-proof forever.',
    },
    {
      step: '02',
      icon: '🏢',
      title: ja ? 'エージェンシーが管理' : 'Agency Manages Leads',
      desc: ja
        ? 'エージェンシーはプライベート保管庫でリードを管理。処理できないリードはパートナーと共有して収益化。'
        : 'Agencies manage leads in a private vault. Unprocessable leads shared with partners — zero waste.',
    },
    {
      step: '03',
      icon: '🏫',
      title: ja ? '教育機関が選択' : 'Institution Selects',
      desc: ja
        ? '大学は認証済み学生プロフィールを閲覧。連絡先は常に非表示。すべての連絡はTensai経由。'
        : 'Universities browse verified student profiles. Contact info always hidden. All communication via Tensai.',
    },
    {
      step: '04',
      icon: '✈️',
      title: ja ? '学生が世界へ' : 'Student Goes Global',
      desc: ja
        ? 'ビザ承認から入学まで、すべてのステップが正式に記録。透明で安全なプロセス。'
        : 'Visa to enrollment — every step formally recorded. A clean, transparent journey end to end.',
    },
  ];

  const TEAM = [
    {
      name: 'Md. Norozzaman',
      initials: 'MN',
      role: ja ? 'ファウンダー & CEO' : 'Founder & CEO',
      bio: ja
        ? 'バングラデシュ生まれの連続起業家。米国登録企業Zonelyも創設。「プロフェッショナルが正当に評価される世界」という信念をTensaiで教育分野に応用。'
        : 'Serial entrepreneur from Bangladesh, also founder of Zonely (USA). Brings the same belief — that talent everywhere deserves to be found — to fix the broken study-abroad industry.',
      badge: ja ? 'ビジョナリー' : 'Visionary',
      avatarBg: 'bg-green-700',
      badgeColor: 'bg-green-100 text-green-800',
      cardBorder: 'border-green-200 hover:border-green-300',
      linkedin: 'https://linkedin.com/in/md-norozzaman-207418169/',
    },
    {
      name: 'Nasir Sarker',
      initials: 'NS',
      role: ja ? '共同創業者 — 事業成長' : 'Co-founder — Business Growth',
      bio: ja
        ? 'Tensaiの成長エンジン。パートナーシップの拡大、エージェンシーネットワーク構築、全国フランチャイズ展開を牽引。'
        : 'The growth engine behind Tensai. Drives partnerships, agency network expansion, and the franchise rollout across Bangladesh.',
      badge: ja ? '成長戦略家' : 'Growth Strategist',
      avatarBg: 'bg-slate-700',
      badgeColor: 'bg-slate-100 text-slate-700',
      cardBorder: 'border-slate-200 hover:border-slate-300',
      linkedin: null,
    },
    {
      name: 'Sabbir',
      initials: 'SB',
      role: ja ? '共同創業者 — 海外大学連携' : 'Co-founder — Foreign Institute Relations',
      bio: ja
        ? '日本を中心とした海外大学・専門学校との直接パートナーシップを担う。学生に本物のチャンスを届ける架け橋。'
        : 'Builds direct partnerships with universities and schools worldwide — especially Japan. The bridge between Tensai and real global opportunities.',
      badge: ja ? '日本スペシャリスト' : 'Japan Specialist',
      avatarBg: 'bg-blue-700',
      badgeColor: 'bg-blue-100 text-blue-800',
      cardBorder: 'border-blue-200 hover:border-blue-300',
      linkedin: null,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/tensai-logo.png" alt="Tensai" width={40} height={40} className="rounded-full object-contain" />
            <div>
              <div className="text-xl font-bold text-green-800 tracking-tight leading-none">Tensai</div>
              <div className="text-[10px] text-slate-400 tracking-wide leading-none mt-0.5 hidden sm:block">The Way of Global Career</div>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggle}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-800 transition-colors"
            >
              {lang === 'en' ? '日本語' : 'English'}
            </button>
            <Link href="/about" className="text-sm font-semibold text-green-700 border-b-2 border-green-600 px-2 py-1 hidden sm:inline">
              {ja ? '私たちについて' : 'About'}
            </Link>
            <Link href="/gallery" className="text-sm text-slate-600 hover:text-green-800 transition-colors px-2 py-1 hidden sm:inline">
              {l.gallery}
            </Link>
            <Link href="/auth/login" className="text-sm text-slate-600 hover:text-green-800 transition-colors px-2 py-1">
              {l.login}
            </Link>
            <Link href="/auth/register" className="text-sm bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-full font-medium transition-colors">
              {l.getStarted}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-16 sm:pt-24 pb-14 sm:pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          🌏 {ja ? '私たちについて' : 'About Tensai'}
        </div>
        <h1 className="text-fluid-hero font-bold text-slate-900 leading-tight mb-6">
          {ja ? '留学を、もっと' : 'Study abroad should be'}<br />
          <span className="text-green-700">{ja ? 'クリーンに。' : 'clean, safe, and honest.'}</span>
        </h1>
        <p className="text-fluid-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-8">
          {ja
            ? '天才は、バングラデシュの学生が詐欺なく、不安なく、グローバルなキャリアを築けるプラットフォームです。'
            : "We built Tensai because the study-abroad process was broken — full of fake documents, dishonest agencies, and students who had no idea if they could trust anyone. We decided to fix it."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/auth/register" className="bg-green-700 hover:bg-green-800 text-white px-7 py-3 rounded-full font-semibold text-sm transition-colors">
            {ja ? '無料で始める →' : 'Get Started Free →'}
          </Link>
          <Link href="#how" className="border border-slate-200 hover:border-green-300 text-slate-700 hover:text-green-800 px-7 py-3 rounded-full font-semibold text-sm transition-colors">
            {ja ? 'どう機能するか ↓' : 'See How It Works ↓'}
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-green-700 py-10 sm:py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-white">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-3xl sm:text-4xl font-bold mb-1">{s.value}</div>
                <div className="text-green-200 text-xs sm:text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-3xl mx-auto px-4 py-14 sm:py-20">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            📖 {ja ? '私たちのストーリー' : 'Our Story'}
          </div>
          <h2 className="text-fluid-4xl font-bold text-slate-900">
            {ja ? 'なぜTensaiを作ったか' : 'Why we built Tensai'}
          </h2>
        </div>
        <div className="space-y-5 text-slate-600 text-fluid-lg leading-relaxed">
          <p>
            {ja
              ? '留学は人生を変えるチャンスです。でも現実は違います。偽の書類、消えるエージェンシー、何十万タカもの手数料を払ったのにビザが却下される学生たち。'
              : 'Studying abroad should be a life-changing opportunity. But for too many Bangladeshi students, it becomes a nightmare — fake documents, disappearing agencies, and hundreds of thousands of taka lost to fraud.'}
          </p>
          <p>
            {ja
              ? '天才はこの問題を根本から解決するために作られました。AI認証でプロフィールをロック。エスクロー決済で資金を保護。すべてのステップを正式に記録。'
              : "Tensai was built to fix this from the root. We lock student profiles with AI-powered document verification. We protect payments through an escrow model. We record every step formally — so there's nowhere to hide and no one to cheat."}
          </p>
          <p>
            {ja
              ? '日本を最初のルートとして選んだのは、日本が最も厳格な基準を求めるからです。その基準を満たせるなら、どこでも通用します。'
              : "We chose Japan as our first corridor because Japan demands the highest standards. If we can build a system that works there, it works everywhere."}
          </p>
        </div>
      </section>

      {/* What We Stand For */}
      <section className="bg-slate-50 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-fluid-4xl font-bold text-slate-900">
              {ja ? '私たちが大切にすること' : 'What We Stand For'}
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              {ja ? '4つの原則がTensaiのすべてを支えている。' : 'Four principles that drive everything we build.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((p) => (
              <div key={p.title} className="bg-white flex flex-col items-start gap-3 p-6 rounded-2xl border border-slate-100 hover:border-green-200 hover:shadow-sm transition-all">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">
                  {p.icon}
                </div>
                <h3 className="font-bold text-slate-900">{p.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="max-w-7xl mx-auto px-4 py-14 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-fluid-4xl font-bold text-slate-900">
            {ja ? 'どうやって機能するか' : 'How Tensai Works'}
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            {ja ? '4つのステップ。完全なエコシステム。' : 'Four steps. One clean ecosystem.'}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {HOW.map((h, i) => (
            <div key={h.step} className="relative bg-white border border-slate-100 rounded-2xl p-6 hover:border-green-200 hover:shadow-md transition-all">
              {i < HOW.length - 1 && (
                <div className="hidden lg:block absolute top-8 -right-3 w-6 h-px bg-slate-200 z-10" />
              )}
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-green-700 text-white text-xs font-bold shrink-0">
                  {h.step}
                </span>
                <span className="text-2xl">{h.icon}</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{h.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="bg-slate-50 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              👥 {ja ? 'チーム' : 'The Team'}
            </div>
            <h2 className="text-fluid-4xl font-bold text-slate-900">
              {ja ? 'Tensaiを作った人たち' : 'The people behind Tensai'}
            </h2>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
              {ja
                ? 'バングラデシュの留学業界を変えることに情熱を持つ3人。'
                : 'Three people who got tired of watching students get cheated — and built something better.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TEAM.map((member) => (
              <div key={member.name} className={`bg-white border rounded-2xl p-7 flex flex-col gap-4 hover:shadow-md transition-all ${member.cardBorder}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${member.avatarBg} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {member.initials}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm leading-tight">{member.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-snug">{member.role}</div>
                  </div>
                </div>
                <span className={`self-start text-[11px] font-semibold px-2.5 py-1 rounded-full ${member.badgeColor}`}>
                  {member.badge}
                </span>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">{member.bio}</p>
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="self-start text-xs text-green-700 font-semibold hover:underline">
                    LinkedIn →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-14 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="text-4xl mb-5">🚀</div>
          <h2 className="text-fluid-4xl font-bold text-white mb-4">
            {ja ? 'グローバルキャリアへの道を、今。' : 'Your global career starts here.'}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mb-8 leading-relaxed">
            {ja
              ? '学生・エージェンシー・教育機関・アフィリエイト — Tensaiはあなたのために作られています。'
              : "Student, agency, university, or affiliate — Tensai was built for you. Join the ecosystem that puts trust first."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/register" className="bg-green-700 hover:bg-green-800 text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-colors">
              {ja ? '無料で始める →' : 'Get Started Free →'}
            </Link>
            <Link href="/" className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-colors">
              {ja ? '← ホームに戻る' : '← Back to Home'}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 sm:py-8 text-center text-sm text-slate-400">
        <div className="mb-3 flex items-center justify-center gap-4">
          <Link href="/about" className="text-green-700 font-medium">{ja ? '私たちについて' : 'About'}</Link>
          <Link href="/terms" className="hover:text-green-700 transition-colors">{ja ? '利用規約' : 'Terms'}</Link>
          <Link href="/privacy" className="hover:text-green-700 transition-colors">{ja ? 'プライバシー' : 'Privacy'}</Link>
        </div>
        {l.footer}
      </footer>
    </div>
  );
}
