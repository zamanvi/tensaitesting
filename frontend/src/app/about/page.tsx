'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  const { t, lang, toggle } = useLang();
  const l = t.landing;
  const ja = lang === 'ja';

  const STATS = [
    { value: '4', label: ja ? 'ãƒ¦ãƒ¼ã‚¶ãƒ¼ã‚²ãƒ¼ãƒˆã‚¦ã‚§ã‚¤' : 'User Gateways' },
    { value: '100%', label: ja ? 'æ›¸é¡žOCRèªè¨¼' : 'OCR-Verified Docs' },
    { value: '0', label: ja ? 'å½ãƒ—ãƒ­ãƒ•ã‚£ãƒ¼ãƒ«' : 'Fake Profiles' },
    { value: 'BDâ†’JP', label: ja ? 'æœ€åˆã®ç•™å­¦ãƒ«ãƒ¼ãƒˆ' : 'First Corridor' },
  ];

  const PILLARS = [
    {
      icon: 'ðŸ”’',
      title: ja ? 'å®Œå…¨ãªé€æ˜Žæ€§' : 'Full Transparency',
      desc: ja ? 'ã™ã¹ã¦ã®æ›¸é¡žãƒ»ã‚¹ãƒ†ãƒƒãƒ—ãƒ»æ±ºå®šãŒè¨˜éŒ²ãƒ»ç›£æŸ»å¯èƒ½ã€‚' : 'Every document, step, and decision is recorded and auditable. Nothing hidden.',
    },
    {
      icon: 'ðŸ¤–',
      title: ja ? 'AIèªè¨¼' : 'AI Verification',
      desc: ja ? 'OCRãŒæ›¸é¡žã‚’è‡ªå‹•ã‚¹ã‚­ãƒ£ãƒ³ã€‚AIãŒå„å›½ã¸ã®é©æ ¼æ€§ã‚’ã‚¹ã‚³ã‚¢ãƒªãƒ³ã‚°ã€‚' : 'OCR auto-scans documents. AI scores student eligibility for each destination.',
    },
    {
      icon: 'ðŸ¤',
      title: ja ? 'B2Bå”æ¥­' : 'B2B Collaboration',
      desc: ja ? 'ã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼ãŒç«¶åˆã›ãšå”åŠ›ã€‚ãƒªãƒ¼ãƒ‰ã‚’å…±æœ‰ã—ã¦å…¨å“¡ãŒåŽç›Šã‚’å¾—ã‚‹ã€‚' : 'Agencies collaborate instead of compete. Share leads â€” everyone earns more.',
    },
    {
      icon: 'ðŸ›¡ï¸',
      title: ja ? 'ãƒ—ãƒ©ã‚¤ãƒã‚·ãƒ¼æœ€å„ªå…ˆ' : 'Privacy First',
      desc: ja ? 'å­¦ç”Ÿã®é€£çµ¡å…ˆã¯å¸¸ã«ãƒžã‚¹ã‚¯ã€‚æ•™è‚²æ©Ÿé–¢ã«ã¯è³‡æ ¼æƒ…å ±ã®ã¿è¡¨ç¤ºã€‚' : 'Student contact info always masked. Institutions see qualifications only.',
    },
  ];

  const HOW = [
    {
      step: '01',
      icon: 'ðŸŽ“',
      title: ja ? 'å­¦ç”ŸãŒç™»éŒ²' : 'Student Signs Up',
      desc: ja
        ? 'AIãŒãƒ‘ã‚¹ãƒãƒ¼ãƒˆã¨æ›¸é¡žã‚’ã‚¹ã‚­ãƒ£ãƒ³ãƒ»èªè¨¼ã€‚ä¸€åº¦èªè¨¼ã•ã‚ŒãŸãƒ—ãƒ­ãƒ•ã‚£ãƒ¼ãƒ«ã¯ãƒ­ãƒƒã‚¯ã•ã‚Œæ”¹ã–ã‚“ä¸å¯ã€‚'
        : 'AI scans and verifies documents instantly. Profile locks after verification â€” tamper-proof forever.',
    },
    {
      step: '02',
      icon: 'ðŸ¢',
      title: ja ? 'ã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼ãŒç®¡ç†' : 'Agency Manages Leads',
      desc: ja
        ? 'ã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼ã¯ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆä¿ç®¡åº«ã§ãƒªãƒ¼ãƒ‰ã‚’ç®¡ç†ã€‚å‡¦ç†ã§ããªã„ãƒªãƒ¼ãƒ‰ã¯ãƒ‘ãƒ¼ãƒˆãƒŠãƒ¼ã¨å…±æœ‰ã—ã¦åŽç›ŠåŒ–ã€‚'
        : 'Agencies manage leads in a private vault. Unprocessable leads shared with partners â€” zero waste.',
    },
    {
      step: '03',
      icon: 'ðŸ«',
      title: ja ? 'æ•™è‚²æ©Ÿé–¢ãŒé¸æŠž' : 'Institution Selects',
      desc: ja
        ? 'å¤§å­¦ã¯èªè¨¼æ¸ˆã¿å­¦ç”Ÿãƒ—ãƒ­ãƒ•ã‚£ãƒ¼ãƒ«ã‚’é–²è¦§ã€‚é€£çµ¡å…ˆã¯å¸¸ã«éžè¡¨ç¤ºã€‚ã™ã¹ã¦ã®é€£çµ¡ã¯TensaiçµŒç”±ã€‚'
        : 'Universities browse verified student profiles. Contact info always hidden. All communication via Tensai.',
    },
    {
      step: '04',
      icon: 'âœˆï¸',
      title: ja ? 'å­¦ç”ŸãŒä¸–ç•Œã¸' : 'Student Goes Global',
      desc: ja
        ? 'ãƒ“ã‚¶æ‰¿èªã‹ã‚‰å…¥å­¦ã¾ã§ã€ã™ã¹ã¦ã®ã‚¹ãƒ†ãƒƒãƒ—ãŒæ­£å¼ã«è¨˜éŒ²ã€‚é€æ˜Žã§å®‰å…¨ãªãƒ—ãƒ­ã‚»ã‚¹ã€‚'
        : 'Visa to enrollment â€” every step formally recorded. A clean, transparent journey end to end.',
    },
  ];

  const TEAM = [
    {
      name: 'Md. Norozzaman',
      initials: 'MN',
      role: ja ? 'ãƒ•ã‚¡ã‚¦ãƒ³ãƒ€ãƒ¼ & CEO' : 'Founder & CEO',
      bio: ja
        ? 'ãƒãƒ³ã‚°ãƒ©ãƒ‡ã‚·ãƒ¥ç”Ÿã¾ã‚Œã®é€£ç¶šèµ·æ¥­å®¶ã€‚ç±³å›½ç™»éŒ²ä¼æ¥­Zonelyã‚‚å‰µè¨­ã€‚ã€Œãƒ—ãƒ­ãƒ•ã‚§ãƒƒã‚·ãƒ§ãƒŠãƒ«ãŒæ­£å½“ã«è©•ä¾¡ã•ã‚Œã‚‹ä¸–ç•Œã€ã¨ã„ã†ä¿¡å¿µã‚’Tensaiã§æ•™è‚²åˆ†é‡Žã«å¿œç”¨ã€‚'
        : 'Serial entrepreneur from Bangladesh, also founder of Zonely (USA). Brings the same belief â€” that talent everywhere deserves to be found â€” to fix the broken study-abroad industry.',
      badge: ja ? 'ãƒ“ã‚¸ãƒ§ãƒŠãƒªãƒ¼' : 'Visionary',
      avatarBg: 'bg-green-700',
      badgeColor: 'bg-green-100 text-green-800',
      cardBorder: 'border-green-200 hover:border-green-300',
      linkedin: 'https://linkedin.com/in/md-norozzaman-207418169/',
    },
    {
      name: 'Nasir Sarker',
      initials: 'NS',
      role: ja ? 'å…±åŒå‰µæ¥­è€… â€” äº‹æ¥­æˆé•·' : 'Co-founder â€” Business Growth',
      bio: ja
        ? 'Tensaiã®æˆé•·ã‚¨ãƒ³ã‚¸ãƒ³ã€‚ãƒ‘ãƒ¼ãƒˆãƒŠãƒ¼ã‚·ãƒƒãƒ—ã®æ‹¡å¤§ã€ã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯æ§‹ç¯‰ã€å…¨å›½ãƒ•ãƒ©ãƒ³ãƒãƒ£ã‚¤ã‚ºå±•é–‹ã‚’ç‰½å¼•ã€‚'
        : 'The growth engine behind Tensai. Drives partnerships, agency network expansion, and the franchise rollout across Bangladesh.',
      badge: ja ? 'æˆé•·æˆ¦ç•¥å®¶' : 'Growth Strategist',
      avatarBg: 'bg-slate-700',
      badgeColor: 'bg-slate-100 text-slate-700',
      cardBorder: 'border-slate-200 hover:border-slate-300',
      linkedin: null,
    },
    {
      name: 'Sabbir',
      initials: 'SB',
      role: ja ? 'å…±åŒå‰µæ¥­è€… â€” æµ·å¤–å¤§å­¦é€£æº' : 'Co-founder â€” Foreign Institute Relations',
      bio: ja
        ? 'æ—¥æœ¬ã‚’ä¸­å¿ƒã¨ã—ãŸæµ·å¤–å¤§å­¦ãƒ»å°‚é–€å­¦æ ¡ã¨ã®ç›´æŽ¥ãƒ‘ãƒ¼ãƒˆãƒŠãƒ¼ã‚·ãƒƒãƒ—ã‚’æ‹…ã†ã€‚å­¦ç”Ÿã«æœ¬ç‰©ã®ãƒãƒ£ãƒ³ã‚¹ã‚’å±Šã‘ã‚‹æž¶ã‘æ©‹ã€‚'
        : 'Builds direct partnerships with universities and schools worldwide â€” especially Japan. The bridge between Tensai and real global opportunities.',
      badge: ja ? 'æ—¥æœ¬ã‚¹ãƒšã‚·ãƒ£ãƒªã‚¹ãƒˆ' : 'Japan Specialist',
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
              {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
            </button>
            <Link href="/about" className="text-sm font-semibold text-green-700 border-b-2 border-green-600 px-2 py-1 hidden sm:inline">
              {ja ? 'ç§ãŸã¡ã«ã¤ã„ã¦' : 'About'}
            </Link>
            <Link href="/team" className="text-sm text-slate-600 hover:text-green-800 transition-colors px-2 py-1 hidden sm:inline">
              {ja ? 'ãƒãƒ¼ãƒ ' : 'Team'}
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
          ðŸŒ {ja ? 'ç§ãŸã¡ã«ã¤ã„ã¦' : 'About Tensai'}
        </div>
        <h1 className="text-fluid-hero font-bold text-slate-900 leading-tight mb-6">
          {ja ? 'ç•™å­¦ã‚’ã€ã‚‚ã£ã¨' : 'Study abroad should be'}<br />
          <span className="text-green-700">{ja ? 'ã‚¯ãƒªãƒ¼ãƒ³ã«ã€‚' : 'clean, safe, and honest.'}</span>
        </h1>
        <p className="text-fluid-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-8">
          {ja
            ? 'å¤©æ‰ã¯ã€ãƒãƒ³ã‚°ãƒ©ãƒ‡ã‚·ãƒ¥ã®å­¦ç”ŸãŒè©æ¬ºãªãã€ä¸å®‰ãªãã€ã‚°ãƒ­ãƒ¼ãƒãƒ«ãªã‚­ãƒ£ãƒªã‚¢ã‚’ç¯‰ã‘ã‚‹ãƒ—ãƒ©ãƒƒãƒˆãƒ•ã‚©ãƒ¼ãƒ ã§ã™ã€‚'
            : "We built Tensai because the study-abroad process was broken â€” full of fake documents, dishonest agencies, and students who had no idea if they could trust anyone. We decided to fix it."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/auth/register" className="bg-green-700 hover:bg-green-800 text-white px-7 py-3 rounded-full font-semibold text-sm transition-colors">
            {ja ? 'ç„¡æ–™ã§å§‹ã‚ã‚‹ â†’' : 'Get Started Free â†’'}
          </Link>
          <Link href="#how" className="border border-slate-200 hover:border-green-300 text-slate-700 hover:text-green-800 px-7 py-3 rounded-full font-semibold text-sm transition-colors">
            {ja ? 'ã©ã†æ©Ÿèƒ½ã™ã‚‹ã‹ â†“' : 'See How It Works â†“'}
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
            ðŸ“– {ja ? 'ç§ãŸã¡ã®ã‚¹ãƒˆãƒ¼ãƒªãƒ¼' : 'Our Story'}
          </div>
          <h2 className="text-fluid-4xl font-bold text-slate-900">
            {ja ? 'ãªãœTensaiã‚’ä½œã£ãŸã‹' : 'Why we built Tensai'}
          </h2>
        </div>
        <div className="space-y-5 text-slate-600 text-fluid-lg leading-relaxed">
          <p>
            {ja
              ? 'ç•™å­¦ã¯äººç”Ÿã‚’å¤‰ãˆã‚‹ãƒãƒ£ãƒ³ã‚¹ã§ã™ã€‚ã§ã‚‚ç¾å®Ÿã¯é•ã„ã¾ã™ã€‚å½ã®æ›¸é¡žã€æ¶ˆãˆã‚‹ã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼ã€ä½•åä¸‡ã‚¿ã‚«ã‚‚ã®æ‰‹æ•°æ–™ã‚’æ‰•ã£ãŸã®ã«ãƒ“ã‚¶ãŒå´ä¸‹ã•ã‚Œã‚‹å­¦ç”ŸãŸã¡ã€‚'
              : 'Studying abroad should be a life-changing opportunity. But for too many Bangladeshi students, it becomes a nightmare â€” fake documents, disappearing agencies, and hundreds of thousands of taka lost to fraud.'}
          </p>
          <p>
            {ja
              ? 'å¤©æ‰ã¯ã“ã®å•é¡Œã‚’æ ¹æœ¬ã‹ã‚‰è§£æ±ºã™ã‚‹ãŸã‚ã«ä½œã‚‰ã‚Œã¾ã—ãŸã€‚AIèªè¨¼ã§ãƒ—ãƒ­ãƒ•ã‚£ãƒ¼ãƒ«ã‚’ãƒ­ãƒƒã‚¯ã€‚ã‚¨ã‚¹ã‚¯ãƒ­ãƒ¼æ±ºæ¸ˆã§è³‡é‡‘ã‚’ä¿è­·ã€‚ã™ã¹ã¦ã®ã‚¹ãƒ†ãƒƒãƒ—ã‚’æ­£å¼ã«è¨˜éŒ²ã€‚'
              : "Tensai was built to fix this from the root. We lock student profiles with AI-powered document verification. We protect payments through an escrow model. We record every step formally â€” so there's nowhere to hide and no one to cheat."}
          </p>
          <p>
            {ja
              ? 'æ—¥æœ¬ã‚’æœ€åˆã®ãƒ«ãƒ¼ãƒˆã¨ã—ã¦é¸ã‚“ã ã®ã¯ã€æ—¥æœ¬ãŒæœ€ã‚‚åŽ³æ ¼ãªåŸºæº–ã‚’æ±‚ã‚ã‚‹ã‹ã‚‰ã§ã™ã€‚ãã®åŸºæº–ã‚’æº€ãŸã›ã‚‹ãªã‚‰ã€ã©ã“ã§ã‚‚é€šç”¨ã—ã¾ã™ã€‚'
              : "We chose Japan as our first corridor because Japan demands the highest standards. If we can build a system that works there, it works everywhere."}
          </p>
        </div>
      </section>

      {/* What We Stand For */}
      <section className="bg-slate-50 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-fluid-4xl font-bold text-slate-900">
              {ja ? 'ç§ãŸã¡ãŒå¤§åˆ‡ã«ã™ã‚‹ã“ã¨' : 'What We Stand For'}
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              {ja ? '4ã¤ã®åŽŸå‰‡ãŒTensaiã®ã™ã¹ã¦ã‚’æ”¯ãˆã¦ã„ã‚‹ã€‚' : 'Four principles that drive everything we build.'}
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
            {ja ? 'ã©ã†ã‚„ã£ã¦æ©Ÿèƒ½ã™ã‚‹ã‹' : 'How Tensai Works'}
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            {ja ? '4ã¤ã®ã‚¹ãƒ†ãƒƒãƒ—ã€‚å®Œå…¨ãªã‚¨ã‚³ã‚·ã‚¹ãƒ†ãƒ ã€‚' : 'Four steps. One clean ecosystem.'}
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
              ðŸ‘¥ {ja ? 'ãƒãƒ¼ãƒ ' : 'The Team'}
            </div>
            <h2 className="text-fluid-4xl font-bold text-slate-900">
              {ja ? 'Tensaiã‚’ä½œã£ãŸäººãŸã¡' : 'The people behind Tensai'}
            </h2>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
              {ja
                ? 'ãƒãƒ³ã‚°ãƒ©ãƒ‡ã‚·ãƒ¥ã®ç•™å­¦æ¥­ç•Œã‚’å¤‰ãˆã‚‹ã“ã¨ã«æƒ…ç†±ã‚’æŒã¤3äººã€‚'
                : 'Three people who got tired of watching students get cheated â€” and built something better.'}
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
                    LinkedIn â†’
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
          <div className="text-4xl mb-5">ðŸš€</div>
          <h2 className="text-fluid-4xl font-bold text-white mb-4">
            {ja ? 'ã‚°ãƒ­ãƒ¼ãƒãƒ«ã‚­ãƒ£ãƒªã‚¢ã¸ã®é“ã‚’ã€ä»Šã€‚' : 'Your global career starts here.'}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mb-8 leading-relaxed">
            {ja
              ? 'å­¦ç”Ÿãƒ»ã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼ãƒ»æ•™è‚²æ©Ÿé–¢ãƒ»ã‚¢ãƒ•ã‚£ãƒªã‚¨ã‚¤ãƒˆ â€” Tensaiã¯ã‚ãªãŸã®ãŸã‚ã«ä½œã‚‰ã‚Œã¦ã„ã¾ã™ã€‚'
              : "Student, agency, university, or affiliate â€” Tensai was built for you. Join the ecosystem that puts trust first."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/register" className="bg-green-700 hover:bg-green-800 text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-colors">
              {ja ? 'ç„¡æ–™ã§å§‹ã‚ã‚‹ â†’' : 'Get Started Free â†’'}
            </Link>
            <Link href="/" className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-colors">
              {ja ? 'â† ãƒ›ãƒ¼ãƒ ã«æˆ»ã‚‹' : 'â† Back to Home'}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 sm:py-8 text-center text-sm text-slate-400">
        <div className="mb-3 flex items-center justify-center gap-4">
          <Link href="/about" className="text-green-700 font-medium">{ja ? 'ç§ãŸã¡ã«ã¤ã„ã¦' : 'About'}</Link>
          <Link href="/terms" className="hover:text-green-700 transition-colors">{ja ? 'åˆ©ç”¨è¦ç´„' : 'Terms'}</Link>
          <Link href="/privacy" className="hover:text-green-700 transition-colors">{ja ? 'ãƒ—ãƒ©ã‚¤ãƒã‚·ãƒ¼' : 'Privacy'}</Link>
        </div>
        {l.footer}
      </footer>
    </div>
  );
}

