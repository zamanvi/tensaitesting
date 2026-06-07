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
      nameJa: 'Md. ãƒŽãƒ­ã‚¶ãƒžãƒ³',
      photo: '/team-norozzaman.jpg',
      initials: 'MN',
      role: ja ? 'ãƒ•ã‚¡ã‚¦ãƒ³ãƒ€ãƒ¼ & CEO' : 'Founder & CEO',
      badge: ja ? 'ãƒ“ã‚¸ãƒ§ãƒŠãƒªãƒ¼' : 'Visionary',
      avatarBg: 'bg-green-700',
      badgeColor: 'bg-green-100 text-green-800',
      bio: ja
        ? 'ãƒãƒ³ã‚°ãƒ©ãƒ‡ã‚·ãƒ¥ç”Ÿã¾ã‚Œã®é€£ç¶šèµ·æ¥­å®¶ã€‚ç±³å›½ç™»éŒ²ä¼æ¥­Zonelyã‚‚å‰µè¨­ã€‚ã€Œä¸–ç•Œä¸­ã®ãƒ—ãƒ­ãƒ•ã‚§ãƒƒã‚·ãƒ§ãƒŠãƒ«ãŒæ­£å½“ã«è©•ä¾¡ã•ã‚Œã‚‹å ´ã‚’ä½œã‚‹ã€ã¨ã„ã†ä¿¡å¿µã‚’Tensaiã§æ•™è‚²åˆ†é‡Žã«å¿œç”¨ã€‚ç•™å­¦æ¥­ç•Œã®è…æ•—ã¨è©æ¬ºã‚’ç›®ã®å½“ãŸã‚Šã«ã—ã€ãƒ†ã‚¯ãƒŽãƒ­ã‚¸ãƒ¼ã§æ ¹æœ¬ã‹ã‚‰å¤‰ãˆã‚‹ã“ã¨ã‚’æ±ºæ„ã€‚'
        : 'Serial entrepreneur born in Bangladesh. Also founder of Zonely â€” a USA-registered platform built on the belief that skilled professionals everywhere deserve to be found. He brings that same philosophy to Tensai: every qualified student deserves a fair, fraud-free shot at a global career. He built Tensai after seeing the dishonesty and broken trust in the study-abroad industry firsthand.',
      skills: ja
        ? ['ãƒ—ãƒ­ãƒ€ã‚¯ãƒˆãƒ“ã‚¸ãƒ§ãƒ³', 'ãƒ—ãƒ©ãƒƒãƒˆãƒ•ã‚©ãƒ¼ãƒ è¨­è¨ˆ', 'äº‹æ¥­æˆ¦ç•¥', 'ãƒ•ãƒ©ãƒ³ãƒãƒ£ã‚¤ã‚ºå±•é–‹']
        : ['Product Vision', 'Platform Architecture', 'Business Strategy', 'Franchise Expansion'],
      linkedin: 'https://linkedin.com/in/md-norozzaman-207418169/',
      also: ja ? 'Zonelyã®ãƒ•ã‚¡ã‚¦ãƒ³ãƒ€ãƒ¼ã§ã‚‚ã‚ã‚‹CEO' : 'Also founder of Zonely (USA)',
      alsoLink: 'https://www.zonelyleads.com',
      quote: ja
        ? 'ã€Œå­¦ç”ŸãŒãƒ“ã‚¶ã‚’å–ã‚Œã‚‹ã‹ã©ã†ã‹ã¯ã€é‹ã‚„äººè„ˆã§ã¯ãªãã€å®ŸåŠ›ã¨èª å®Ÿã•ã§æ±ºã¾ã‚‹ã¹ãã ã€‚ã€'
        : '"Whether a student gets their visa shouldn\'t depend on luck or connections. It should depend on merit and honesty. That\'s what Tensai is built to guarantee."',
    },
    {
      name: 'Nasir Sarker',
      photo: null,
      nameJa: 'ãƒŠã‚·ãƒ«ãƒ»ã‚µãƒ¼ã‚«ãƒ¼',
      initials: 'NS',
      role: ja ? 'å…±åŒå‰µæ¥­è€… â€” äº‹æ¥­æˆé•·' : 'Co-founder â€” Business Growth',
      badge: ja ? 'æˆé•·æˆ¦ç•¥å®¶' : 'Growth Strategist',
      avatarBg: 'bg-slate-700',
      badgeColor: 'bg-slate-100 text-slate-700',
      bio: ja
        ? 'Tensaiã®æˆé•·ã‚¨ãƒ³ã‚¸ãƒ³ã€‚ã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã®æ‹¡å¤§ã€ãƒ‘ãƒ¼ãƒˆãƒŠãƒ¼ã‚·ãƒƒãƒ—ã®æ§‹ç¯‰ã€ãã—ã¦å…¨å›½ãƒ•ãƒ©ãƒ³ãƒãƒ£ã‚¤ã‚ºãƒ¢ãƒ‡ãƒ«ã®å±•é–‹ã‚’ç‰½å¼•ã€‚ãƒãƒ³ã‚°ãƒ©ãƒ‡ã‚·ãƒ¥å…¨åœŸã§Tensaiã‚’ã€Œãƒ—ãƒ©ãƒƒãƒˆãƒ•ã‚©ãƒ¼ãƒ ã€ã‹ã‚‰ã€Œãƒ ãƒ¼ãƒ–ãƒ¡ãƒ³ãƒˆã€ã¸ã¨è»¢æ›ã•ã›ã‚‹å½¹å‰²ã‚’æ‹…ã†ã€‚'
        : 'The growth engine behind Tensai. Nasir drives agency network expansion, partnership development, and the nationwide franchise rollout. His role is to turn Tensai from a platform into a movement â€” reaching every district in Bangladesh and beyond.',
      skills: ja
        ? ['ãƒ‘ãƒ¼ãƒˆãƒŠãƒ¼ã‚·ãƒƒãƒ—é–‹ç™º', 'ã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯', 'ãƒ•ãƒ©ãƒ³ãƒãƒ£ã‚¤ã‚ºç®¡ç†', 'å¸‚å ´é–‹æ‹“']
        : ['Partnership Development', 'Agency Network', 'Franchise Management', 'Market Expansion'],
      linkedin: null,
      also: null,
      alsoLink: null,
      quote: ja
        ? 'ã€Œã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼ãŒç«¶äº‰ã§ã¯ãªãå”åŠ›ã§ãã‚‹ä»•çµ„ã¿ã‚’ä½œã‚Œã°ã€èª°ã‚‚æã‚’ã—ãªã„ã€‚ã€'
        : '"If you build a system where agencies collaborate instead of compete, nobody loses â€” especially not the students."',
    },
    {
      name: 'Sabbir',
      photo: '/team-sabbir.jpg',
      nameJa: 'ã‚µãƒƒãƒ“ãƒ«',
      initials: 'SB',
      role: ja ? 'å…±åŒå‰µæ¥­è€… â€” æµ·å¤–å¤§å­¦é€£æºãƒžãƒãƒ¼ã‚¸ãƒ£ãƒ¼' : 'Co-founder â€” Foreign Institute Relations',
      badge: ja ? 'æ—¥æœ¬ã‚¹ãƒšã‚·ãƒ£ãƒªã‚¹ãƒˆ' : 'Japan Specialist',
      avatarBg: 'bg-blue-700',
      badgeColor: 'bg-blue-100 text-blue-800',
      bio: ja
        ? 'Tensaiã¨Worldä¸­ã®æ•™è‚²æ©Ÿé–¢ã‚’ã¤ãªãæž¶ã‘æ©‹ã€‚ç‰¹ã«æ—¥æœ¬ã®å¤§å­¦ãƒ»å°‚é–€å­¦æ ¡ã¨ã®ç›´æŽ¥ãƒ‘ãƒ¼ãƒˆãƒŠãƒ¼ã‚·ãƒƒãƒ—æ§‹ç¯‰ã‚’æ‹…å½“ã€‚å­¦ç”Ÿã«ã€Œç´„æŸã€ã§ã¯ãªãã€Œæœ¬ç‰©ã®ãƒãƒ£ãƒ³ã‚¹ã€ã‚’å±Šã‘ã‚‹ãŸã‚ã€æ©Ÿé–¢ã¨ã®ä¿¡é ¼é–¢ä¿‚ã‚’ä¸€ã¤ã²ã¨ã¤ä¸å¯§ã«æ§‹ç¯‰ã—ã¦ã„ã‚‹ã€‚'
        : 'The bridge between Tensai and institutions around the world. Sabbir specializes in building direct partnerships with universities and vocational schools â€” especially in Japan. His work ensures students get real opportunities backed by genuine institutional relationships, not empty promises.',
      skills: ja
        ? ['æ—¥æœ¬ã®æ•™è‚²æ©Ÿé–¢é€£æº', 'å¤§å­¦ãƒ‘ãƒ¼ãƒˆãƒŠãƒ¼ã‚·ãƒƒãƒ—', 'å›½éš›é–¢ä¿‚', 'æ©Ÿé–¢èªè¨¼']
        : ['Japan Institute Relations', 'University Partnerships', 'International Relations', 'Institutional Vetting'],
      linkedin: null,
      also: null,
      alsoLink: null,
      quote: ja
        ? 'ã€Œæ—¥æœ¬ã®å¤§å­¦ã¯ä¿¡é ¼ã§ãã‚‹ãƒ‘ãƒ¼ãƒˆãƒŠãƒ¼ã‚’æ±‚ã‚ã¦ã„ã‚‹ã€‚ç§ãŸã¡ã¯ãã®ä¿¡é ¼ã‚’ä¸€ã¤ã²ã¨ã¤ç©ã¿ä¸Šã’ã‚‹ã€‚ã€'
        : '"Japanese institutions are looking for partners they can genuinely trust. We earn that trust one relationship at a time â€” no shortcuts."',
    },
  ];

  const VALUES = [
    { icon: 'ðŸŽ¯', title: ja ? 'ä¸€ã¤ã®ãƒŸãƒƒã‚·ãƒ§ãƒ³' : 'One Mission', desc: ja ? 'ç•™å­¦ã‚’ã™ã¹ã¦ã®å­¦ç”Ÿã«ã¨ã£ã¦ã‚¯ãƒªãƒ¼ãƒ³ã§å…¬å¹³ã«ã€‚' : 'Make study abroad clean and fair for every student.' },
    { icon: 'ðŸ›¡ï¸', title: ja ? 'ä¿¡é ¼ãŒæœ€å„ªå…ˆ' : 'Trust First', desc: ja ? 'ä¿¡é ¼ã¯Tensaiã®ã™ã¹ã¦ã®æ±ºå®šã®åŸºç›¤ã€‚' : 'Trust is the foundation of every decision we make.' },
    { icon: 'ðŸŒ', title: ja ? 'ã‚°ãƒ­ãƒ¼ãƒãƒ«æ€è€ƒ' : 'Global Thinking', desc: ja ? 'ãƒãƒ³ã‚°ãƒ©ãƒ‡ã‚·ãƒ¥ã‹ã‚‰å§‹ã‚ã€ä¸–ç•Œã¸ã€‚' : 'Starting from Bangladesh, building for the world.' },
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
              {ja ? 'ç§ãŸã¡ã«ã¤ã„ã¦' : 'About'}
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
            ðŸ‘¥ {ja ? 'ãƒãƒ¼ãƒ ' : 'Our Team'}
          </div>
          <h1 className="text-fluid-hero font-black text-white mb-5">
            {ja ? 'Tensaiã‚’ä½œã£ãŸ' : 'The people'}<br />
            <span className="gradient-text">{ja ? '3äººã®ãƒãƒ¼ãƒ ' : 'behind Tensai'}</span>
          </h1>
          <p className="text-fluid-lg text-white/50 max-w-xl mx-auto leading-relaxed">
            {ja
              ? 'ãƒãƒ³ã‚°ãƒ©ãƒ‡ã‚·ãƒ¥ã®ç•™å­¦æ¥­ç•Œã‚’å¤‰ãˆã‚‹ã“ã¨ã«æƒ…ç†±ã‚’æŒã¤3äººã®å‰µæ¥­è€…ã€‚ãã‚Œãžã‚Œã®å°‚é–€æ€§ãŒTensaiã‚’æ”¯ãˆã¦ã„ã‚‹ã€‚'
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
                <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-lg`}>
                  {member.photo ? (
                    <Image src={member.photo} alt={member.name} width={112} height={112} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className={`w-full h-full ${member.avatarBg} flex items-center justify-center text-white text-3xl font-black`}>
                      {member.initials}
                    </div>
                  )}
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${member.badgeColor}`}>
                  {member.badge}
                </span>
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-green-700 font-semibold hover:underline flex items-center gap-1">
                    LinkedIn â†’
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
                      ðŸ”— {member.also}
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
                    {ja ? 'å°‚é–€åˆ†é‡Ž' : 'Focus Areas'}
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
            {ja ? 'ãƒãƒ¼ãƒ ãŒå…±æœ‰ã™ã‚‹ä¾¡å€¤è¦³' : 'What drives us'}
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
      <section className="max-w-3xl mx-auto px-4 pb-16 sm:pb-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            ðŸ•°ï¸ {ja ? 'å‰µæ¥­ã®æ­©ã¿' : 'How It Started'}
          </div>
          <h2 className="text-fluid-4xl font-bold text-slate-900">
            {ja ? 'Tensaiã®èª•ç”Ÿ' : 'The founding story'}
          </h2>
        </div>
        <div className="relative">
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-slate-200 sm:-translate-x-px" />
          {[
            {
              date: ja ? '2024å¹´ æ—©æœŸ' : 'Early 2024',
              title: ja ? 'å•é¡Œã‚’ç™ºè¦‹' : 'The Problem Identified',
              desc: ja ? 'ãƒŽãƒ­ã‚¶ãƒžãƒ³ã¯ç•™å­¦æ¥­ç•Œã§ç¹°ã‚Šè¿”ã•ã‚Œã‚‹è©æ¬ºã¨ä¸é€æ˜Žã•ã‚’ç›®æ’ƒã€‚ã€Œãƒ†ã‚¯ãƒŽãƒ­ã‚¸ãƒ¼ã§è§£æ±ºã§ãã‚‹ã€ã¨ç¢ºä¿¡ã€‚' : 'Norozzaman witnesses repeated fraud and opacity in the study-abroad industry. Convinced technology can fix it.',
              side: 'left',
            },
            {
              date: ja ? '2024å¹´ ä¸­æœŸ' : 'Mid 2024',
              title: ja ? 'ãƒãƒ¼ãƒ ã®çµæˆ' : 'The Team Forms',
              desc: ja ? 'ãƒŠã‚·ãƒ«ï¼ˆæˆé•·æ‹…å½“ï¼‰ã¨ã‚µãƒƒãƒ“ãƒ«ï¼ˆæ—¥æœ¬é€£æºæ‹…å½“ï¼‰ãŒå‚åŠ ã€‚3äººã®å‰µæ¥­ãƒãƒ¼ãƒ ãŒæƒã†ã€‚' : 'Nasir (growth) and Sabbir (Japan relations) join. The founding trio is complete.',
              side: 'right',
            },
            {
              date: ja ? '2024å¹´ å¾ŒæœŸ' : 'Late 2024',
              title: ja ? 'ãƒ—ãƒ©ãƒƒãƒˆãƒ•ã‚©ãƒ¼ãƒ æ§‹ç¯‰é–‹å§‹' : 'Platform Built',
              desc: ja ? 'OCRèªè¨¼ã‚·ã‚¹ãƒ†ãƒ ã€4ã‚²ãƒ¼ãƒˆã‚¦ã‚§ã‚¤æ§‹é€ ã€ã‚³ãƒ³ã‚¿ã‚¯ãƒˆãƒšãƒ¼ãƒ‘ãƒ¼ã‚·ã‚¹ãƒ†ãƒ ã‚’è¨­è¨ˆãƒ»é–‹ç™ºã€‚' : 'OCR verification, 4-gateway structure, and contact paper system designed and developed.',
              side: 'left',
            },
            {
              date: ja ? '2026å¹´' : '2026',
              title: ja ? 'ãƒ­ãƒ¼ãƒ³ãƒ & æ‹¡å¤§' : 'Launch & Expand',
              desc: ja ? 'ãƒãƒ³ã‚°ãƒ©ãƒ‡ã‚·ãƒ¥â†’æ—¥æœ¬ãƒ«ãƒ¼ãƒˆã§ãƒ­ãƒ¼ãƒ³ãƒã€‚ãƒ•ãƒ©ãƒ³ãƒãƒ£ã‚¤ã‚ºå±•é–‹ã‚’é–‹å§‹ã—ã€å…¨å›½ã¸æ‹¡å¤§ä¸­ã€‚' : 'Launched on the Bangladeshâ†’Japan corridor. Franchise rollout begins. Nationwide expansion in progress.',
              side: 'right',
            },
          ].map((item, i) => (
            <div key={i} className={`relative flex flex-col sm:flex-row gap-4 mb-8 ${item.side === 'right' ? 'sm:flex-row-reverse' : ''}`}>
              <div className="sm:w-1/2 sm:px-6">
                <div className={`bg-white border border-slate-100 rounded-2xl p-5 hover:border-green-200 hover:shadow-sm transition-all ${item.side === 'right' ? 'sm:text-right' : ''}`}>
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
              {ja ? 'ãƒãƒ¼ãƒ ã®æ–‡åŒ–' : 'How we work'}
            </h2>
            <p className="text-white/40 text-fluid-base max-w-xl mx-auto">
              {ja ? 'ç§ãŸã¡ãŒå¤§åˆ‡ã«ã—ã¦ã„ã‚‹åƒãæ–¹ã€‚' : 'The principles that guide how we operate day to day.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: 'ðŸš€', title: ja ? 'å®Ÿè¡ŒãŒæœ€å„ªå…ˆ' : 'Execution Over Talk', desc: ja ? 'ä¼šè­°ã‚ˆã‚Šå®Ÿè£…ã€‚è¨ˆç”»ã‚ˆã‚Šå‡ºè·ã€‚ã‚¢ã‚¤ãƒ‡ã‚¢ã¯å‹•ã„ã¦ã‹ã‚‰è©•ä¾¡ã™ã‚‹ã€‚' : 'We ship over debate. Ideas earn credibility by working, not by sounding good.' },
              { icon: 'ðŸ”’', title: ja ? 'ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£ã¯å¦¥å”ã—ãªã„' : 'No Compromise on Security', desc: ja ? 'å­¦ç”Ÿã®ãƒ‡ãƒ¼ã‚¿ã¨ãƒ‰ã‚­ãƒ¥ãƒ¡ãƒ³ãƒˆã¯ç¥žè–ã€‚ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£ã¯ã‚³ã‚¹ãƒˆå‰Šæ¸›ã®å¯¾è±¡ã§ã¯ãªã„ã€‚' : "Student data and documents are sacred. Security is never a cost-cutting candidate." },
              { icon: 'ðŸŒ', title: ja ? 'ã‚°ãƒ­ãƒ¼ãƒãƒ«ãªè¦–ç‚¹' : 'Think Global, Act Local', desc: ja ? 'ãƒãƒ³ã‚°ãƒ©ãƒ‡ã‚·ãƒ¥ã®ç¾å ´ã‚’ç†è§£ã—ãªãŒã‚‰ã€ä¸–ç•ŒåŸºæº–ã§è¨­è¨ˆã™ã‚‹ã€‚' : 'Deep local understanding. Global-standard execution.' },
              { icon: 'ðŸ¤', title: ja ? 'é€æ˜Žãªã‚³ãƒŸãƒ¥ãƒ‹ã‚±ãƒ¼ã‚·ãƒ§ãƒ³' : 'Radical Transparency', desc: ja ? 'è‰¯ã„ãƒ‹ãƒ¥ãƒ¼ã‚¹ã‚‚æ‚ªã„ãƒ‹ãƒ¥ãƒ¼ã‚¹ã‚‚åŒã˜é€Ÿã•ã§å…±æœ‰ã™ã‚‹ã€‚éš ã—äº‹ã¯ãªã„ã€‚' : 'Good news and bad news travel at the same speed. No hidden agendas.' },
              { icon: 'ðŸ“ˆ', title: ja ? 'ãƒ‡ãƒ¼ã‚¿ã§æ„æ€æ±ºå®š' : 'Data-Driven Decisions', desc: ja ? 'ç›´æ„Ÿã‚ˆã‚Šæ•°å­—ã€‚ãŸã ã—æ•°å­—ãŒèªžã‚Œãªã„ã“ã¨ã¯ã€ç¾å ´ã§ç¢ºèªã™ã‚‹ã€‚' : 'Numbers over gut feelings. But what numbers can\'t explain, we verify on the ground.' },
              { icon: 'ðŸŽ¯', title: ja ? 'ãƒŸãƒƒã‚·ãƒ§ãƒ³ä¸­å¿ƒ' : 'Mission-Centered', desc: ja ? 'ç§åˆ©ã§ã¯ãªãå­¦ç”Ÿã®ãŸã‚ã«ã€‚ã™ã¹ã¦ã®æ±ºå®šã‚’ãƒŸãƒƒã‚·ãƒ§ãƒ³ã«ç…§ã‚‰ã™ã€‚' : 'Every decision is checked against the mission â€” not personal gain.' },
            ].map((c) => (
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
            ðŸ’¼ {ja ? 'æŽ¡ç”¨æƒ…å ±' : "We're Hiring"}
          </div>
          <h2 className="text-fluid-4xl font-bold text-slate-900 mb-3">
            {ja ? 'Tensaiã«å‚åŠ ã™ã‚‹' : 'Join the mission'}
          </h2>
          <p className="text-fluid-base text-slate-500 max-w-md mx-auto">
            {ja ? 'ç§ãŸã¡ã¯ãƒãƒ¼ãƒ ã‚’æ‹¡å¤§ã—ã¦ã„ã¾ã™ã€‚æƒ…ç†±ã‚ã‚‹ãƒ¡ãƒ³ãƒãƒ¼ã‚’æŽ¢ã—ã¦ã„ã¾ã™ã€‚' : "We're growing. If you believe in building clean, trustworthy systems that change lives â€” there may be a place for you here."}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { role: ja ? 'ãƒ•ãƒ«ã‚¹ã‚¿ãƒƒã‚¯é–‹ç™ºè€…' : 'Full-Stack Developer', type: ja ? 'ãƒ•ãƒ«ã‚¿ã‚¤ãƒ ' : 'Full-time', tag: ja ? 'æŽ¡ç”¨ä¸­' : 'Open', tagColor: 'bg-green-100 text-green-800' },
            { role: ja ? 'ã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼æ‹…å½“å–¶æ¥­' : 'Agency Sales Executive', type: ja ? 'ãƒ•ãƒ«ã‚¿ã‚¤ãƒ  / ãƒãƒ³ã‚°ãƒ©ãƒ‡ã‚·ãƒ¥' : 'Full-time Â· Bangladesh', tag: ja ? 'æŽ¡ç”¨ä¸­' : 'Open', tagColor: 'bg-green-100 text-green-800' },
            { role: ja ? 'æ—¥æœ¬èªžé€šè¨³ãƒ»ã‚³ãƒ¼ãƒ‡ã‚£ãƒãƒ¼ã‚¿ãƒ¼' : 'Japanese Interpreter / Coordinator', type: ja ? 'ãƒ‘ãƒ¼ãƒˆã‚¿ã‚¤ãƒ å¯' : 'Part-time OK', tag: ja ? 'æŽ¡ç”¨ä¸­' : 'Open', tagColor: 'bg-green-100 text-green-800' },
            { role: ja ? 'ãƒ•ãƒ©ãƒ³ãƒãƒ£ã‚¤ã‚ºãƒ‘ãƒ¼ãƒˆãƒŠãƒ¼' : 'Franchise Partner', type: ja ? 'å…¨å›½å„åœ°' : 'Nationwide Bangladesh', tag: ja ? 'å‹Ÿé›†ä¸­' : 'Inquire', tagColor: 'bg-blue-100 text-blue-800' },
          ].map((r) => (
            <div key={r.role} className="flex items-center justify-between border border-slate-100 rounded-2xl p-5 hover:border-green-200 hover:shadow-sm transition-all group">
              <div>
                <div className="font-bold text-slate-900 text-sm">{r.role}</div>
                <div className="text-xs text-slate-400 mt-0.5">{r.type}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${r.tagColor}`}>{r.tag}</span>
                <a href="mailto:support@tensai.com"
                  className="text-xs font-semibold text-green-700 opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                  Apply â†’
                </a>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">
          {ja ? 'æŽ²è¼‰ã•ã‚Œã¦ã„ãªã„å½¹å‰²ã«èˆˆå‘³ãŒã‚ã‚‹å ´åˆã¯ã€' : "Don't see your role? "}<a href="mailto:support@tensai.com" className="text-green-700 hover:underline">{ja ? 'ãƒ¡ãƒ¼ãƒ«ã§ã”é€£çµ¡ãã ã•ã„ã€‚' : 'Email us anyway.'}</a>
        </p>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
        <h2 className="text-fluid-4xl font-bold text-slate-900 mb-4">
          {ja ? 'ä¸€ç·’ã«åƒããŸã„ã§ã™ã‹ï¼Ÿ' : 'Want to work with us?'}
        </h2>
        <p className="text-fluid-base text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
          {ja
            ? 'Tensaiã¯å¸¸ã«æƒ…ç†±ã‚ã‚‹äººæã‚’æŽ¢ã—ã¦ã„ã¾ã™ã€‚ãƒŸãƒƒã‚·ãƒ§ãƒ³ã«å…±æ„Ÿã™ã‚‹æ–¹ã¯ã”é€£çµ¡ãã ã•ã„ã€‚'
            : "Tensai is always looking for passionate people who believe in the mission. If that's you, reach out."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="mailto:support@tensai.com"
            className="bg-green-700 hover:bg-green-800 text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-colors">
            {ja ? 'ãƒ¡ãƒ¼ãƒ«ã‚’é€ã‚‹ â†’' : 'Get in Touch â†’'}
          </a>
          <Link href="/about"
            className="border border-slate-200 hover:border-green-300 text-slate-700 hover:text-green-800 px-8 py-3.5 rounded-full font-semibold text-sm transition-colors">
            {ja ? 'â† ç§ãŸã¡ã«ã¤ã„ã¦' : 'â† About Tensai'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 sm:py-8 text-center text-sm text-slate-400">
        <div className="mb-3 flex items-center justify-center gap-4">
          <Link href="/about" className="hover:text-green-700 transition-colors">{ja ? 'ç§ãŸã¡ã«ã¤ã„ã¦' : 'About'}</Link>
          <Link href="/team" className="text-green-700 font-medium">{ja ? 'ãƒãƒ¼ãƒ ' : 'Team'}</Link>
          <Link href="/terms" className="hover:text-green-700 transition-colors">{ja ? 'åˆ©ç”¨è¦ç´„' : 'Terms'}</Link>
          <Link href="/privacy" className="hover:text-green-700 transition-colors">{ja ? 'ãƒ—ãƒ©ã‚¤ãƒã‚·ãƒ¼' : 'Privacy'}</Link>
        </div>
        {l.footer}
      </footer>
    </div>
  );
}

