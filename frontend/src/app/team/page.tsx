'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';

export default function TeamPage() {
  const { t, lang, toggle } = useLang();
  const l = t.landing;
  const ja = lang === 'ja';

  const TEAM = [
    {
      name: 'Md. Norozzaman',
      nameJa: 'Md. ノロザマン',
      initials: 'MN',
      role: ja ? 'ファウンダー & CEO' : 'Founder & CEO',
      badge: ja ? 'ビジョナリー' : 'Visionary',
      avatarBg: 'bg-green-700',
      badgeColor: 'bg-green-100 text-green-800',
      bio: ja
        ? 'バングラデシュ生まれの連続起業家。米国登録企業Zonelyも創設。「世界中のプロフェッショナルが正当に評価される場を作る」という信念をTensaiで教育分野に応用。留学業界の腐敗と詐欺を目の当たりにし、テクノロジーで根本から変えることを決意。'
        : 'Serial entrepreneur born in Bangladesh. Also founder of Zonely — a USA-registered platform built on the belief that skilled professionals everywhere deserve to be found. He brings that same philosophy to Tensai: every qualified student deserves a fair, fraud-free shot at a global career. He built Tensai after seeing the dishonesty and broken trust in the study-abroad industry firsthand.',
      skills: ja
        ? ['プロダクトビジョン', 'プラットフォーム設計', '事業戦略', 'フランチャイズ展開']
        : ['Product Vision', 'Platform Architecture', 'Business Strategy', 'Franchise Expansion'],
      linkedin: 'https://linkedin.com/in/md-norozzaman-207418169/',
      also: ja ? 'ZonelyのファウンダーでもあるCEO' : 'Also founder of Zonely (USA)',
      alsoLink: 'https://www.zonelyleads.com',
    },
    {
      name: 'Nasir Sarker',
      nameJa: 'ナシル・サーカー',
      initials: 'NS',
      role: ja ? '共同創業者 — 事業成長' : 'Co-founder — Business Growth',
      badge: ja ? '成長戦略家' : 'Growth Strategist',
      avatarBg: 'bg-slate-700',
      badgeColor: 'bg-slate-100 text-slate-700',
      bio: ja
        ? 'Tensaiの成長エンジン。エージェンシーネットワークの拡大、パートナーシップの構築、そして全国フランチャイズモデルの展開を牽引。バングラデシュ全土でTensaiを「プラットフォーム」から「ムーブメント」へと転換させる役割を担う。'
        : 'The growth engine behind Tensai. Nasir drives agency network expansion, partnership development, and the nationwide franchise rollout. His role is to turn Tensai from a platform into a movement — reaching every district in Bangladesh and beyond.',
      skills: ja
        ? ['パートナーシップ開発', 'エージェンシーネットワーク', 'フランチャイズ管理', '市場開拓']
        : ['Partnership Development', 'Agency Network', 'Franchise Management', 'Market Expansion'],
      linkedin: null,
      also: null,
      alsoLink: null,
    },
    {
      name: 'Sabbir',
      nameJa: 'サッビル',
      initials: 'SB',
      role: ja ? '共同創業者 — 海外大学連携マネージャー' : 'Co-founder — Foreign Institute Relations',
      badge: ja ? '日本スペシャリスト' : 'Japan Specialist',
      avatarBg: 'bg-blue-700',
      badgeColor: 'bg-blue-100 text-blue-800',
      bio: ja
        ? 'TensaiとWorld中の教育機関をつなぐ架け橋。特に日本の大学・専門学校との直接パートナーシップ構築を担当。学生に「約束」ではなく「本物のチャンス」を届けるため、機関との信頼関係を一つひとつ丁寧に構築している。'
        : 'The bridge between Tensai and institutions around the world. Sabbir specializes in building direct partnerships with universities and vocational schools — especially in Japan. His work ensures students get real opportunities backed by genuine institutional relationships, not empty promises.',
      skills: ja
        ? ['日本の教育機関連携', '大学パートナーシップ', '国際関係', '機関認証']
        : ['Japan Institute Relations', 'University Partnerships', 'International Relations', 'Institutional Vetting'],
      linkedin: null,
      also: null,
      alsoLink: null,
    },
  ];

  const VALUES = [
    { icon: '🎯', title: ja ? '一つのミッション' : 'One Mission', desc: ja ? '留学をすべての学生にとってクリーンで公平に。' : 'Make study abroad clean and fair for every student.' },
    { icon: '🛡️', title: ja ? '信頼が最優先' : 'Trust First', desc: ja ? '信頼はTensaiのすべての決定の基盤。' : 'Trust is the foundation of every decision we make.' },
    { icon: '🌏', title: ja ? 'グローバル思考' : 'Global Thinking', desc: ja ? 'バングラデシュから始め、世界へ。' : 'Starting from Bangladesh, building for the world.' },
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
            <button onClick={toggle} className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-800 transition-colors">
              {lang === 'en' ? '日本語' : 'English'}
            </button>
            <Link href="/about" className="text-sm text-slate-600 hover:text-green-800 transition-colors px-2 py-1 hidden sm:inline">
              {ja ? '私たちについて' : 'About'}
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
      <section className="bg-slate-900 text-white py-16 sm:py-24 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            👥 {ja ? 'チーム' : 'Our Team'}
          </div>
          <h1 className="text-fluid-hero font-black text-white mb-5">
            {ja ? 'Tensaiを作った' : 'The people'}<br />
            <span className="gradient-text">{ja ? '3人のチーム' : 'behind Tensai'}</span>
          </h1>
          <p className="text-fluid-lg text-white/50 max-w-xl mx-auto leading-relaxed">
            {ja
              ? 'バングラデシュの留学業界を変えることに情熱を持つ3人の創業者。それぞれの専門性がTensaiを支えている。'
              : 'Three founders. One shared frustration with a broken industry. One mission to fix it with technology, trust, and relentless execution.'}
          </p>
        </div>
      </section>

      {/* Team Cards */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
        <div className="space-y-8 sm:space-y-6">
          {TEAM.map((member, i) => (
            <div key={member.name}
              className={`flex flex-col sm:flex-row gap-8 p-8 sm:p-10 rounded-3xl border border-slate-100 hover:border-green-200 hover:shadow-lg transition-all ${i % 2 === 1 ? 'sm:flex-row-reverse bg-slate-50' : 'bg-white'}`}
            >
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4 shrink-0">
                <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ${member.avatarBg} flex items-center justify-center text-white text-3xl font-black shadow-lg`}>
                  {member.initials}
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${member.badgeColor}`}>
                  {member.badge}
                </span>
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-green-700 font-semibold hover:underline flex items-center gap-1">
                    LinkedIn →
                  </a>
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="mb-4">
                  <h2 className="text-fluid-3xl font-black text-slate-900 leading-tight">{member.name}</h2>
                  <p className="text-fluid-base text-green-700 font-semibold mt-1">{member.role}</p>
                  {member.also && member.alsoLink && (
                    <a href={member.alsoLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mt-1 transition-colors">
                      🔗 {member.also}
                    </a>
                  )}
                </div>

                <p className="text-fluid-base text-slate-600 leading-relaxed mb-6">{member.bio}</p>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    {ja ? '専門分野' : 'Focus Areas'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((s) => (
                      <span key={s} className="text-xs font-medium bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team Values */}
      <section className="bg-green-700 py-14 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-fluid-4xl font-bold text-white mb-10">
            {ja ? 'チームが共有する価値観' : 'What drives us'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white/10 border border-white/15 rounded-2xl p-6 text-left hover:bg-white/15 transition-all">
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-white mb-2">{v.title}</h3>
                <p className="text-green-100 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
        <h2 className="text-fluid-4xl font-bold text-slate-900 mb-4">
          {ja ? '一緒に働きたいですか？' : 'Want to work with us?'}
        </h2>
        <p className="text-fluid-base text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
          {ja
            ? 'Tensaiは常に情熱ある人材を探しています。ミッションに共感する方はご連絡ください。'
            : "Tensai is always looking for passionate people who believe in the mission. If that's you, reach out."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="mailto:support@tensai.com"
            className="bg-green-700 hover:bg-green-800 text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-colors">
            {ja ? 'メールを送る →' : 'Get in Touch →'}
          </a>
          <Link href="/about"
            className="border border-slate-200 hover:border-green-300 text-slate-700 hover:text-green-800 px-8 py-3.5 rounded-full font-semibold text-sm transition-colors">
            {ja ? '← 私たちについて' : '← About Tensai'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 sm:py-8 text-center text-sm text-slate-400">
        <div className="mb-3 flex items-center justify-center gap-4">
          <Link href="/about" className="hover:text-green-700 transition-colors">{ja ? '私たちについて' : 'About'}</Link>
          <Link href="/team" className="text-green-700 font-medium">{ja ? 'チーム' : 'Team'}</Link>
          <Link href="/terms" className="hover:text-green-700 transition-colors">{ja ? '利用規約' : 'Terms'}</Link>
          <Link href="/privacy" className="hover:text-green-700 transition-colors">{ja ? 'プライバシー' : 'Privacy'}</Link>
        </div>
        {l.footer}
      </footer>
    </div>
  );
}
