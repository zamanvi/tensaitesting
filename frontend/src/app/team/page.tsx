'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';

export default function TeamPage() {
  const { t, lang, toggle } = useLang();
  const l = t.landing;
  const a = t.about;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const TEAM = [
    {
      name: 'Md. Norozzaman',
      nameJa: 'Md. ノロザマン',
      photo: 'https://pub-f01f8a3511524b808cb8116aa5d495aa.r2.dev/ceo.webp',
      initials: 'MN',
      role: a.role1,
      badge: a.badge1,
      avatarBg: 'bg-green-700',
      badgeColor: 'bg-green-100 text-green-800',
      bio: ja
        ? 'バングラデシュ生まれの連続起業家。米国登録企業Zonelyも創設。「世界中のプロフェッショナルが正当に評価される場を作る」という信念をTensaiで教育分野に応用。留学業界の腐敗と詐欺を目の当たりにし、テクノロジーで根本から変えることを決意。'
        : bn
        ? 'বাংলাদেশের ধারাবাহিক উদ্যোক্তা। মার্কিন কোম্পানি Zonely-রও প্রতিষ্ঠাতা। "বিশ্বের প্রতিটি প্রতিভার সঠিক মূল্যায়ন হোক" — এই বিশ্বাস নিয়ে টেনসাই তৈরি করেছেন। বিদেশ পড়াশোনার শিল্পে প্রতারণা দেখে প্রযুক্তি দিয়ে বদলানোর সিদ্ধান্ত নিয়েছেন।'
        : 'Serial entrepreneur born in Bangladesh. Also founder of Zonely — a USA-registered platform built on the belief that skilled professionals everywhere deserve to be found. He brings that same philosophy to Tensai: every qualified student deserves a fair, fraud-free shot at a global career.',
      skills: ja
        ? ['プロダクトビジョン', 'プラットフォーム設計', '事業戦略', 'フランチャイズ展開']
        : bn
        ? ['পণ্য দৃষ্টিভঙ্গি', 'প্ল্যাটফর্ম স্থাপত্য', 'ব্যবসায়িক কৌশল', 'ফ্র্যাঞ্চাইজি সম্প্রসারণ']
        : ['Product Vision', 'Platform Architecture', 'Business Strategy', 'Franchise Expansion'],
      linkedin: 'https://linkedin.com/in/md-norozzaman-207418169/',
      also: ja ? 'ZonelyのファウンダーでもあるCEO' : bn ? 'Zonely (USA)-এরও প্রতিষ্ঠাতা' : 'Also founder of Zonely (USA)',
      alsoLink: 'https://www.zonelyleads.com',
      quote: ja
        ? '「学生がビザを取れるかどうかは、運や人脈ではなく、実力と誠実さで決まるべきだ。」'
        : bn
        ? '"একজন শিক্ষার্থী ভিসা পাবে কিনা, সেটা ভাগ্য বা পরিচিতির উপর নির্ভর করা উচিত নয় — মেধা ও সততার উপর নির্ভর করা উচিত।"'
        : '"Whether a student gets their visa should not depend on luck or connections. It should depend on merit and honesty. That\'s what Tensai is built to guarantee."',
    },
    {
      name: 'Nasir Sarker',
      photo: null,
      nameJa: 'ナシル・サーカー',
      initials: 'NS',
      role: a.role2,
      badge: a.badge2,
      avatarBg: 'bg-slate-700',
      badgeColor: 'bg-slate-100 text-slate-700',
      bio: ja
        ? 'Tensaiの成長エンジン。エージェンシーネットワークの拡大、パートナーシップの構築、そして全国フランチャイズモデルの展開を牽引。バングラデシュ全土でTensaiを「プラットフォーム」から「ムーブメント」へと転換させる役割を担う。'
        : bn
        ? 'টেনসাইয়ের গ্রোথ ইঞ্জিন। এজেন্সি নেটওয়ার্ক সম্প্রসারণ, পার্টনারশিপ উন্নয়ন এবং সারাদেশে ফ্র্যাঞ্চাইজি রোলআউট পরিচালনা করছেন। সারাবাংলাদেশে টেনসাইকে একটি আন্দোলনে পরিণত করাই তার লক্ষ্য।'
        : 'The growth engine behind Tensai. Nasir drives agency network expansion, partnership development, and the nationwide franchise rollout. His role is to turn Tensai from a platform into a movement — reaching every district in Bangladesh and beyond.',
      skills: ja
        ? ['パートナーシップ開発', 'エージェンシーネットワーク', 'フランチャイズ管理', '市場開拓']
        : bn
        ? ['পার্টনারশিপ উন্নয়ন', 'এজেন্সি নেটওয়ার্ক', 'ফ্র্যাঞ্চাইজি ব্যবস্থাপনা', 'বাজার সম্প্রসারণ']
        : ['Partnership Development', 'Agency Network', 'Franchise Management', 'Market Expansion'],
      linkedin: null,
      also: null,
      alsoLink: null,
      quote: ja
        ? '「エージェンシーが競争ではなく協力できる仕組みを作れば、誰も損をしない。」'
        : bn
        ? '"এজেন্সিগুলো যদি প্রতিযোগিতার বদলে সহযোগিতা করে, তাহলে কেউ হারে না — বিশেষ করে শিক্ষার্থীরা।"'
        : '"If you build a system where agencies collaborate instead of compete, nobody loses — especially not the students."',
    },
    {
      name: 'Sabbir',
      photo: 'https://pub-f01f8a3511524b808cb8116aa5d495aa.r2.dev/WhatsApp%20Image%202026-06-06%20at%209.06.32%20PM.jpeg',
      nameJa: 'サッビル',
      initials: 'SB',
      role: a.role3,
      badge: a.badge3,
      avatarBg: 'bg-blue-700',
      badgeColor: 'bg-blue-100 text-blue-800',
      bio: ja
        ? 'Tensaiと世界中の教育機関をつなぐ架け橋。特に日本の大学・専門学校との直接パートナーシップ構築を担当。学生に「約束」ではなく「本物のチャンス」を届けるため、機関との信頼関係を一つひとつ丁寧に構築している。'
        : bn
        ? 'টেনসাই এবং বিশ্বের শিক্ষাপ্রতিষ্ঠানগুলোর মধ্যে সেতু। বিশেষ করে জাপানের বিশ্ববিদ্যালয় ও কলেজের সাথে সরাসরি অংশীদারিত্ব গড়ে তুলছেন। শিক্ষার্থীদের "প্রতিশ্রুতি" নয়, "বাস্তব সুযোগ" দিতে প্রতিটি সম্পর্ক যত্ন নিয়ে তৈরি করছেন।'
        : 'The bridge between Tensai and institutions around the world. Sabbir specializes in building direct partnerships with universities and vocational schools — especially in Japan. His work ensures students get real opportunities backed by genuine institutional relationships, not empty promises.',
      skills: ja
        ? ['日本の教育機関連携', '大学パートナーシップ', '国際関係', '機関認証']
        : bn
        ? ['জাপান প্রতিষ্ঠান সম্পর্ক', 'বিশ্ববিদ্যালয় অংশীদারিত্ব', 'আন্তর্জাতিক সম্পর্ক', 'প্রতিষ্ঠান যাচাই']
        : ['Japan Institute Relations', 'University Partnerships', 'International Relations', 'Institutional Vetting'],
      linkedin: null,
      also: null,
      alsoLink: null,
      quote: ja
        ? '「日本の大学は信頼できるパートナーを求めている。私たちはその信頼を一つひとつ積み上げる。」'
        : bn
        ? '"জাপানি প্রতিষ্ঠানগুলো বিশ্বস্ত অংশীদার খোঁজে। আমরা সেই বিশ্বাস একটি একটি করে অর্জন করি — কোনো শর্টকাট নেই।"'
        : '"Japanese institutions are looking for partners they can genuinely trust. We earn that trust one relationship at a time — no shortcuts."',
    },
  ];

  const VALUES = [
    {
      icon: '🎯',
      title: ja ? '一つのミッション' : bn ? 'একটি লক্ষ্য' : 'One Mission',
      desc: ja ? '留学をすべての学生にとってクリーンで公平に。' : bn ? 'প্রতিটি শিক্ষার্থীর জন্য বিদেশ পড়াশোনাকে পরিষ্কার ও ন্যায্য করা।' : 'Make study abroad clean and fair for every student.',
    },
    {
      icon: '🛡️',
      title: ja ? '信頼が最優先' : bn ? 'বিশ্বাস সর্বোচ্চ' : 'Trust First',
      desc: ja ? '信頼はTensaiのすべての決定の基盤。' : bn ? 'বিশ্বাস টেনসাইয়ের প্রতিটি সিদ্ধান্তের ভিত্তি।' : 'Trust is the foundation of every decision we make.',
    },
    {
      icon: '🌏',
      title: ja ? 'グローバル思考' : bn ? 'বৈশ্বিক চিন্তা' : 'Global Thinking',
      desc: ja ? 'バングラデシュから始め、世界へ。' : bn ? 'বাংলাদেশ থেকে শুরু, বিশ্বের জন্য গড়া।' : 'Starting from Bangladesh, building for the world.',
    },
  ];

  const TIMELINE = [
    {
      date: ja ? '2024年 早期' : bn ? '২০২৪ প্রথমদিকে' : 'Early 2024',
      title: ja ? '問題を発見' : bn ? 'সমস্যা চিহ্নিত' : 'The Problem Identified',
      desc: ja ? 'ノロザマンは留学業界で繰り返される詐欺と不透明さを目撃。「テクノロジーで解決できる」と確信。' : bn ? 'নরোজামান বিদেশ পড়াশোনার শিল্পে বারবার প্রতারণা ও অস্বচ্ছতা দেখেন। প্রযুক্তি দিয়ে সমাধান সম্ভব বলে দৃঢ়প্রতিজ্ঞ হন।' : 'Norozzaman witnesses repeated fraud and opacity in the study-abroad industry. Convinced technology can fix it.',
    },
    {
      date: ja ? '2024年 中期' : bn ? '২০২৪ মাঝামাঝি' : 'Mid 2024',
      title: ja ? 'チームの結成' : bn ? 'দল গঠন' : 'The Team Forms',
      desc: ja ? 'ナシル（成長担当）とサッビル（日本連携担当）が参加。3人の創業チームが揃う。' : bn ? 'নাসির (গ্রোথ) এবং সাব্বির (জাপান সম্পর্ক) যোগ দেন। তিনজনের প্রতিষ্ঠাতা দল সম্পূর্ণ হয়।' : 'Nasir (growth) and Sabbir (Japan relations) join. The founding trio is complete.',
    },
    {
      date: ja ? '2024年 後期' : bn ? '২০২৪ শেষদিকে' : 'Late 2024',
      title: ja ? 'プラットフォーム構築開始' : bn ? 'প্ল্যাটফর্ম নির্মাণ' : 'Platform Built',
      desc: ja ? 'OCR認証システム、4ゲートウェイ構造、コンタクトペーパーシステムを設計・開発。' : bn ? 'OCR যাচাই সিস্টেম, ৪-গেটওয়ে কাঠামো এবং কন্টাক্ট পেপার সিস্টেম ডিজাইন ও তৈরি।' : 'OCR verification, 4-gateway structure, and contact paper system designed and developed.',
    },
    {
      date: ja ? '2026年' : bn ? '২০২৬' : '2026',
      title: ja ? 'ローンチ & 拡大' : bn ? 'লঞ্চ ও সম্প্রসারণ' : 'Launch & Expand',
      desc: ja ? 'バングラデシュ→日本ルートでローンチ。フランチャイズ展開を開始し、全国へ拡大中。' : bn ? 'বাংলাদেশ→জাপান করিডোরে লঞ্চ। ফ্র্যাঞ্চাইজি রোলআউট শুরু। সারাদেশে সম্প্রসারণ চলছে।' : 'Launched on the Bangladesh→Japan corridor. Franchise rollout begins. Nationwide expansion in progress.',
    },
  ];

  const CULTURE = [
    {
      icon: '🚀',
      title: ja ? '実行が最優先' : bn ? 'বাস্তবায়নই প্রথম' : 'Execution Over Talk',
      desc: ja ? '会議より実装。計画より出荷。アイデアは動いてから評価する。' : bn ? 'আলোচনার চেয়ে বাস্তবায়ন। পরিকল্পনার চেয়ে শিপিং। আইডিয়া কাজ করলে তবেই মূল্যায়ন।' : 'We ship over debate. Ideas earn credibility by working, not by sounding good.',
    },
    {
      icon: '🔒',
      title: ja ? 'セキュリティは妥協しない' : bn ? 'নিরাপত্তায় আপোস নেই' : 'No Compromise on Security',
      desc: ja ? '学生のデータとドキュメントは神聖。セキュリティはコスト削減の対象ではない。' : bn ? 'শিক্ষার্থীর তথ্য ও কাগজপত্র পবিত্র। নিরাপত্তা কখনো খরচ কাটার বিষয় নয়।' : "Student data and documents are sacred. Security is never a cost-cutting candidate.",
    },
    {
      icon: '🌏',
      title: ja ? 'グローバルな視点' : bn ? 'বৈশ্বিক দৃষ্টিভঙ্গি' : 'Think Global, Act Local',
      desc: ja ? 'バングラデシュの現場を理解しながら、世界基準で設計する。' : bn ? 'স্থানীয় বাস্তবতা বুঝে বৈশ্বিক মানে কাজ করা।' : 'Deep local understanding. Global-standard execution.',
    },
    {
      icon: '🤝',
      title: ja ? '透明なコミュニケーション' : bn ? 'সম্পূর্ণ স্বচ্ছতা' : 'Radical Transparency',
      desc: ja ? '良いニュースも悪いニュースも同じ速さで共有する。隠し事はない。' : bn ? 'ভালো খবর ও খারাপ খবর সমান গতিতে শেয়ার হয়। কোনো লুকোচুরি নেই।' : 'Good news and bad news travel at the same speed. No hidden agendas.',
    },
    {
      icon: '📈',
      title: ja ? 'データで意思決定' : bn ? 'তথ্যভিত্তিক সিদ্ধান্ত' : 'Data-Driven Decisions',
      desc: ja ? '直感より数字。ただし数字が語れないことは、現場で確認する。' : bn ? 'অনুভূতির চেয়ে তথ্য। তবে তথ্য না বললে মাঠে যাচাই করি।' : "Numbers over gut feelings. But what numbers can't explain, we verify on the ground.",
    },
    {
      icon: '🎯',
      title: ja ? 'ミッション中心' : bn ? 'লক্ষ্যকেন্দ্রিক' : 'Mission-Centered',
      desc: ja ? '私利ではなく学生のため。すべての決定をミッションに照らす。' : bn ? 'নিজের জন্য নয়, শিক্ষার্থীর জন্য। প্রতিটি সিদ্ধান্ত লক্ষ্যের আলোয় যাচাই।' : "Every decision is checked against the mission — not personal gain.",
    },
  ];

  const ROLES = [
    {
      role: ja ? 'フルスタック開発者' : bn ? 'ফুল-স্ট্যাক ডেভেলপার' : 'Full-Stack Developer',
      type: ja ? 'フルタイム' : bn ? 'ফুল-টাইম' : 'Full-time',
      tag: ja ? '採用中' : bn ? 'খোলা' : 'Open',
      tagColor: 'bg-green-100 text-green-800',
    },
    {
      role: ja ? 'エージェンシー担当営業' : bn ? 'এজেন্সি সেলস এক্সিকিউটিভ' : 'Agency Sales Executive',
      type: ja ? 'フルタイム / バングラデシュ' : bn ? 'ফুল-টাইম · বাংলাদেশ' : 'Full-time · Bangladesh',
      tag: ja ? '採用中' : bn ? 'খোলা' : 'Open',
      tagColor: 'bg-green-100 text-green-800',
    },
    {
      role: ja ? '日本語通訳・コーディネーター' : bn ? 'জাপানি দোভাষী / সমন্বয়কারী' : 'Japanese Interpreter / Coordinator',
      type: ja ? 'パートタイム可' : bn ? 'পার্ট-টাইম সম্ভব' : 'Part-time OK',
      tag: ja ? '採用中' : bn ? 'খোলা' : 'Open',
      tagColor: 'bg-green-100 text-green-800',
    },
    {
      role: ja ? 'フランチャイズパートナー' : bn ? 'ফ্র্যাঞ্চাইজি পার্টনার' : 'Franchise Partner',
      type: ja ? '全国各地' : bn ? 'সারাদেশ' : 'Nationwide Bangladesh',
      tag: ja ? '募集中' : bn ? 'আবেদন করুন' : 'Inquire',
      tagColor: 'bg-blue-100 text-blue-800',
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
            <button onClick={toggle} className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-800 transition-colors">
              {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
            </button>
            <Link href="/about" className="text-sm text-slate-600 hover:text-green-800 transition-colors px-2 py-1 hidden sm:inline">
              {a.navAbout}
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
            {ja ? 'チーム' : bn ? 'আমাদের দল' : 'Our Team'}
          </div>
          <h1 className="text-fluid-hero font-black text-white mb-5">
            {ja ? 'Tensaiを作った' : bn ? 'যাঁরা তৈরি করেছেন' : 'The people'}<br />
            <span className="gradient-text">{ja ? '3人のチーム' : bn ? 'টেনসাই' : 'behind Tensai'}</span>
          </h1>
          <p className="text-fluid-lg text-white/50 max-w-xl mx-auto leading-relaxed">
            {ja
              ? 'バングラデシュの留学業界を変えることに情熱を持つ3人の創業者。それぞれの専門性がTensaiを支えている。'
              : bn
              ? 'তিনজন প্রতিষ্ঠাতা। একটি ভাঙা শিল্পের প্রতি একই হতাশা। প্রযুক্তি, বিশ্বাস ও অদম্য কার্যক্ষমতা দিয়ে তা ঠিক করার একটি লক্ষ্য।'
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
              <div className="flex flex-col items-center gap-4 shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-lg">
                  {member.photo ? (
                    <Image src={member.photo} alt={member.name} width={112} height={112} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className={`w-full h-full ${member.avatarBg} flex items-center justify-center text-white text-3xl font-black`}>
                      {member.initials}
                    </div>
                  )}
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${member.badgeColor}`}>{member.badge}</span>
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 font-semibold hover:underline flex items-center gap-1">
                    LinkedIn →
                  </a>
                )}
              </div>

              <div className="flex-1">
                <div className="mb-4">
                  <h2 className="text-fluid-3xl font-black text-slate-900 leading-tight">{member.name}</h2>
                  <p className="text-fluid-base text-green-700 font-semibold mt-1">{member.role}</p>
                  {member.also && member.alsoLink && (
                    <a href={member.alsoLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mt-1 transition-colors">
                      🔗 {member.also}
                    </a>
                  )}
                </div>
                <p className="text-fluid-base text-slate-600 leading-relaxed mb-6">{member.bio}</p>
                {member.quote && (
                  <blockquote className="border-l-4 border-green-500 pl-4 mb-5 italic text-slate-500 text-fluid-sm leading-relaxed">
                    {member.quote}
                  </blockquote>
                )}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    {ja ? '専門分野' : bn ? 'মূল দক্ষতা' : 'Focus Areas'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((s) => (
                      <span key={s} className="text-xs font-medium bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200">{s}</span>
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
            {ja ? 'チームが共有する価値観' : bn ? 'আমাদের মূল মূল্যবোধ' : 'What drives us'}
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

      {/* Founding Timeline */}
      <section className="max-w-3xl mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            {ja ? '創業の歩み' : bn ? 'প্রতিষ্ঠার গল্প' : 'How It Started'}
          </div>
          <h2 className="text-fluid-4xl font-bold text-slate-900">
            {ja ? 'Tensaiの誕生' : bn ? 'টেনসাইয়ের জন্ম' : 'The founding story'}
          </h2>
        </div>
        <div className="relative">
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-slate-200 sm:-translate-x-px" />
          {TIMELINE.map((item, i) => (
            <div key={i} className={`relative flex flex-col sm:flex-row gap-4 mb-8 ${i % 2 === 1 ? 'sm:flex-row-reverse' : ''}`}>
              <div className="sm:w-1/2 sm:px-6">
                <div className={`bg-white border border-slate-100 rounded-2xl p-5 hover:border-green-200 hover:shadow-sm transition-all ${i % 2 === 1 ? 'sm:text-right' : ''}`}>
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{item.date}</span>
                  <h3 className="font-bold text-slate-900 mt-2 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
              <div className="hidden sm:flex sm:w-1/2" />
              <div className="absolute left-4 sm:left-1/2 top-5 w-3 h-3 rounded-full bg-green-600 border-2 border-white shadow sm:-translate-x-1.5" />
            </div>
          ))}
        </div>
      </section>

      {/* Culture */}
      <section className="bg-slate-900 py-14 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-fluid-4xl font-bold text-white mb-3">
              {ja ? 'チームの文化' : bn ? 'আমরা যেভাবে কাজ করি' : 'How we work'}
            </h2>
            <p className="text-white/40 text-fluid-base max-w-xl mx-auto">
              {ja ? '私たちが大切にしている働き方。' : bn ? 'প্রতিদিনের কাজ পরিচালনার মূলনীতি।' : 'The principles that guide how we operate day to day.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CULTURE.map((c) => (
              <div key={c.title} className="glass-card rounded-2xl p-6 flex flex-col gap-3 card-hover-glow transition-all">
                <div className="text-2xl">{c.icon}</div>
                <h3 className="font-bold text-white text-sm">{c.title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section className="max-w-4xl mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            {ja ? '採用情報' : bn ? 'আমরা নিয়োগ দিচ্ছি' : "We're Hiring"}
          </div>
          <h2 className="text-fluid-4xl font-bold text-slate-900 mb-3">
            {ja ? 'Tensaiに参加する' : bn ? 'লক্ষ্যে যোগ দিন' : 'Join the mission'}
          </h2>
          <p className="text-fluid-base text-slate-500 max-w-md mx-auto">
            {ja
              ? '私たちはチームを拡大しています。情熱あるメンバーを探しています。'
              : bn
              ? 'আমরা বাড়ছি। যদি আপনি বিশ্বাস করেন যে বিশ্বস্ত ব্যবস্থা জীবন বদলাতে পারে — আপনার জায়গা হয়তো এখানেই।'
              : "We're growing. If you believe in building clean, trustworthy systems that change lives — there may be a place for you here."}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ROLES.map((r) => (
            <div key={r.role} className="flex items-center justify-between border border-slate-100 rounded-2xl p-5 hover:border-green-200 hover:shadow-sm transition-all group">
              <div>
                <div className="font-bold text-slate-900 text-sm">{r.role}</div>
                <div className="text-xs text-slate-400 mt-0.5">{r.type}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${r.tagColor}`}>{r.tag}</span>
                <a href="mailto:support@tensai.com" className="text-xs font-semibold text-green-700 opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                  {ja ? '応募 →' : bn ? 'আবেদন →' : 'Apply →'}
                </a>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">
          {ja ? '掲載されていない役割に興味がある場合は、' : bn ? 'আপনার পছন্দের পদ না থাকলে, '  : "Don't see your role? "}
          <a href="mailto:support@tensai.com" className="text-green-700 hover:underline">
            {ja ? 'メールでご連絡ください。' : bn ? 'আমাদের ইমেইল করুন।' : 'Email us anyway.'}
          </a>
        </p>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
        <h2 className="text-fluid-4xl font-bold text-slate-900 mb-4">
          {ja ? '一緒に働きたいですか？' : bn ? 'আমাদের সাথে কাজ করতে চান?' : 'Want to work with us?'}
        </h2>
        <p className="text-fluid-base text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
          {ja
            ? 'Tensaiは常に情熱ある人材を探しています。ミッションに共感する方はご連絡ください。'
            : bn
            ? 'টেনসাই সবসময় অনুপ্রাণিত মানুষ খোঁজে। লক্ষ্যে বিশ্বাস রাখলে যোগাযোগ করুন।'
            : "Tensai is always looking for passionate people who believe in the mission. If that's you, reach out."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="mailto:support@tensai.com" className="bg-green-700 hover:bg-green-800 text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-colors">
            {ja ? 'メールを送る →' : bn ? 'যোগাযোগ করুন →' : 'Get in Touch →'}
          </a>
          <Link href="/about" className="border border-slate-200 hover:border-green-300 text-slate-700 hover:text-green-800 px-8 py-3.5 rounded-full font-semibold text-sm transition-colors">
            {ja ? '← 私たちについて' : bn ? '← আমাদের সম্পর্কে' : '← About Tensai'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 sm:py-8 text-center text-sm text-slate-400">
        <div className="mb-3 flex items-center justify-center gap-4">
          <Link href="/about" className="hover:text-green-700 transition-colors">{a.navAbout}</Link>
          <Link href="/team" className="text-green-700 font-medium">{a.navTeam}</Link>
          <Link href="/terms" className="hover:text-green-700 transition-colors">{ja ? '利用規約' : bn ? 'শর্তাবলী' : 'Terms'}</Link>
          <Link href="/privacy" className="hover:text-green-700 transition-colors">{ja ? 'プライバシー' : bn ? 'প্রাইভেসি' : 'Privacy'}</Link>
        </div>
        {l.footer}
      </footer>
    </div>
  );
}
