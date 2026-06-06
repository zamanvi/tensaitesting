'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';

const SECTIONS_EN = [
  {
    title: '1. Who We Are',
    body: 'Tensai Language & Study Consultancy operates the Tensai platform â€” an AI-powered education network connecting Bangladeshi students with global institutions. This Privacy Policy explains what data we collect, why we collect it, and how we protect it.',
  },
  {
    title: '2. What Data We Collect',
    body: 'We collect: (a) Account data â€” name, email, phone number, account type. (b) Profile data â€” date of birth, gender, nationality, address, academic history, emergency contacts. (c) Documents â€” passport scans, certificates, transcripts, and other verification documents processed via OCR. (d) Usage data â€” login activity, pages visited, actions taken on the platform. (e) Communication data â€” messages sent through the contact paper/ticket system.',
  },
  {
    title: '3. How We Use Your Data',
    body: 'Your data is used to: verify your identity and documents; match students with suitable institutions and agencies; process applications and track lead status; send platform notifications and updates; generate anonymized analytics to improve the service; comply with legal obligations.',
  },
  {
    title: '4. Document Locking & OCR Processing',
    body: 'When you upload a document, it is processed by our OCR system to extract and verify data. Once an admin verifies your profile, documents are locked â€” they cannot be altered, replaced, or deleted. This is a core security feature, not a limitation. Locked documents ensure the integrity of your verified profile.',
  },
  {
    title: '5. Who Can See Your Data',
    body: 'Students: your contact information (phone, email) is never shown to institutions or agencies. Institutions see your qualifications, academic scores, and language certificates only â€” not your identity details. Agencies assigned to your lead see your name and basic profile as needed to process your application. Tensai staff with admin access can view all data for verification and support purposes.',
  },
  {
    title: '6. Data Sharing with Third Parties',
    body: 'We do not sell your data. We may share data with: trusted technology partners who help run the platform (e.g. cloud hosting, email delivery); government or regulatory bodies if required by law; partner institutions or agencies strictly within the scope of your application. All third parties are bound by data protection agreements.',
  },
  {
    title: '7. Data Security',
    body: 'We use AES-256 encryption for stored data. All communications are secured via HTTPS. Role-based access control ensures staff only see data relevant to their function. We conduct regular security audits. Despite these measures, no system is 100% secure â€” we encourage you to use a strong, unique password.',
  },
  {
    title: '8. Data Retention',
    body: 'We retain your account data for as long as your account is active. After account deletion, we may retain anonymized data for analytics and legal compliance for up to 3 years. Documents submitted for verification are retained for audit purposes in line with applicable regulations.',
  },
  {
    title: '9. Your Rights',
    body: 'You have the right to: access the personal data we hold about you; request correction of inaccurate data; request deletion of your account and associated data (subject to legal retention obligations); withdraw consent for non-essential data processing. To exercise these rights, contact support@tensai.com.',
  },
  {
    title: '10. Cookies & Tracking',
    body: 'We use cookies to maintain your session and remember your language preference. We do not use third-party advertising cookies. You can disable cookies in your browser settings, but some platform features may not work correctly.',
  },
  {
    title: '11. Children\'s Privacy',
    body: 'Tensai is not intended for users under 18 without guardian consent. We do not knowingly collect personal data from minors. If we become aware that a minor has provided data without consent, we will delete it immediately.',
  },
  {
    title: '12. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. The updated version will be posted here with a revised date. For significant changes, we will notify you via email or an in-platform alert.',
  },
  {
    title: '13. Contact Us',
    body: 'If you have questions about this Privacy Policy or how your data is handled, contact our team at: support@tensai.com',
  },
];

const SECTIONS_JA = [
  {
    title: '1. ç§ãŸã¡ã«ã¤ã„ã¦',
    body: 'Tensai Language & Study Consultancyã¯ã€AIã‚’æ´»ç”¨ã—ãŸæ•™è‚²ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã€ŒTensaiã€ã‚’é‹å–¶ã—ã¦ã„ã¾ã™ã€‚æœ¬ãƒ—ãƒ©ã‚¤ãƒã‚·ãƒ¼ãƒãƒªã‚·ãƒ¼ã¯ã€åŽé›†ã™ã‚‹ãƒ‡ãƒ¼ã‚¿ã€åŽé›†ã®ç›®çš„ã€ãŠã‚ˆã³ä¿è­·æ–¹æ³•ã«ã¤ã„ã¦èª¬æ˜Žã—ã¾ã™ã€‚',
  },
  {
    title: '2. åŽé›†ã™ã‚‹ãƒ‡ãƒ¼ã‚¿',
    body: '(a) ã‚¢ã‚«ã‚¦ãƒ³ãƒˆãƒ‡ãƒ¼ã‚¿ï¼šåå‰ã€ãƒ¡ãƒ¼ãƒ«ã€é›»è©±ç•ªå·ã€ã‚¢ã‚«ã‚¦ãƒ³ãƒˆç¨®åˆ¥ã€‚(b) ãƒ—ãƒ­ãƒ•ã‚£ãƒ¼ãƒ«ãƒ‡ãƒ¼ã‚¿ï¼šç”Ÿå¹´æœˆæ—¥ã€æ€§åˆ¥ã€å›½ç±ã€ä½æ‰€ã€å­¦æ­´ã€ç·Šæ€¥é€£çµ¡å…ˆã€‚(c) æ›¸é¡žï¼šOCRã§å‡¦ç†ã•ã‚Œã‚‹ãƒ‘ã‚¹ãƒãƒ¼ãƒˆã‚¹ã‚­ãƒ£ãƒ³ã€è¨¼æ˜Žæ›¸ã€æˆç¸¾è¨¼æ˜Žæ›¸ã€‚(d) åˆ©ç”¨ãƒ‡ãƒ¼ã‚¿ï¼šãƒ­ã‚°ã‚¤ãƒ³å±¥æ­´ã€é–²è¦§ãƒšãƒ¼ã‚¸ã€ãƒ—ãƒ©ãƒƒãƒˆãƒ•ã‚©ãƒ¼ãƒ ä¸Šã®æ“ä½œã€‚(e) é€šä¿¡ãƒ‡ãƒ¼ã‚¿ï¼šã‚³ãƒ³ã‚¿ã‚¯ãƒˆãƒšãƒ¼ãƒ‘ãƒ¼/ãƒã‚±ãƒƒãƒˆã‚·ã‚¹ãƒ†ãƒ ã‚’é€šã˜ãŸãƒ¡ãƒƒã‚»ãƒ¼ã‚¸ã€‚',
  },
  {
    title: '3. ãƒ‡ãƒ¼ã‚¿ã®åˆ©ç”¨ç›®çš„',
    body: 'æœ¬äººç¢ºèªã¨æ›¸é¡žèªè¨¼ã€å­¦ç”Ÿã¨é©åˆ‡ãªæ©Ÿé–¢ãƒ»ã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼ã®ãƒžãƒƒãƒãƒ³ã‚°ã€ç”³è«‹å‡¦ç†ã¨ãƒªãƒ¼ãƒ‰ã‚¹ãƒ†ãƒ¼ã‚¿ã‚¹è¿½è·¡ã€ãƒ—ãƒ©ãƒƒãƒˆãƒ•ã‚©ãƒ¼ãƒ é€šçŸ¥ã®é€ä¿¡ã€ã‚µãƒ¼ãƒ“ã‚¹æ”¹å–„ã®ãŸã‚ã®åŒ¿ååŒ–åˆ†æžã€æ³•çš„ç¾©å‹™ã®éµå®ˆã€‚',
  },
  {
    title: '4. æ›¸é¡žãƒ­ãƒƒã‚¯ã¨OCRå‡¦ç†',
    body: 'æ›¸é¡žã‚’ã‚¢ãƒƒãƒ—ãƒ­ãƒ¼ãƒ‰ã™ã‚‹ã¨ã€OCRã‚·ã‚¹ãƒ†ãƒ ãŒãƒ‡ãƒ¼ã‚¿ã‚’æŠ½å‡ºãƒ»æ¤œè¨¼ã—ã¾ã™ã€‚ç®¡ç†è€…ãŒãƒ—ãƒ­ãƒ•ã‚£ãƒ¼ãƒ«ã‚’èªè¨¼ã™ã‚‹ã¨æ›¸é¡žã¯ãƒ­ãƒƒã‚¯ã•ã‚Œã€å¤‰æ›´ãƒ»ç½®æ›ãƒ»å‰Šé™¤ã§ããªããªã‚Šã¾ã™ã€‚ã“ã‚Œã¯ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£æ©Ÿèƒ½ã§ã‚ã‚Šã€èªè¨¼æ¸ˆã¿ãƒ—ãƒ­ãƒ•ã‚£ãƒ¼ãƒ«ã®å®Œå…¨æ€§ã‚’ä¿è¨¼ã—ã¾ã™ã€‚',
  },
  {
    title: '5. ãƒ‡ãƒ¼ã‚¿ã¸ã®ã‚¢ã‚¯ã‚»ã‚¹æ¨©é™',
    body: 'å­¦ç”Ÿã®é€£çµ¡å…ˆï¼ˆé›»è©±ãƒ»ãƒ¡ãƒ¼ãƒ«ï¼‰ã¯æ•™è‚²æ©Ÿé–¢ã‚„ã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼ã«ã¯è¡¨ç¤ºã•ã‚Œã¾ã›ã‚“ã€‚æ•™è‚²æ©Ÿé–¢ã¯è³‡æ ¼ãƒ»å­¦åŠ›ãƒ»èªžå­¦ã‚¹ã‚³ã‚¢ã®ã¿é–²è¦§å¯èƒ½ã§ã™ã€‚æ‹…å½“ã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼ã¯ç”³è«‹å‡¦ç†ã«å¿…è¦ãªç¯„å›²ã§åå‰ã¨åŸºæœ¬ãƒ—ãƒ­ãƒ•ã‚£ãƒ¼ãƒ«ã‚’é–²è¦§ã§ãã¾ã™ã€‚',
  },
  {
    title: '6. ç¬¬ä¸‰è€…ã¸ã®ãƒ‡ãƒ¼ã‚¿å…±æœ‰',
    body: 'å€‹äººãƒ‡ãƒ¼ã‚¿ã‚’è²©å£²ã™ã‚‹ã“ã¨ã¯ã‚ã‚Šã¾ã›ã‚“ã€‚ã‚¯ãƒ©ã‚¦ãƒ‰ãƒ›ã‚¹ãƒ†ã‚£ãƒ³ã‚°ãƒ»ãƒ¡ãƒ¼ãƒ«é…ä¿¡ç­‰ã®ä¿¡é ¼ã§ãã‚‹æŠ€è¡“ãƒ‘ãƒ¼ãƒˆãƒŠãƒ¼ã€æ³•å¾‹ã§è¦æ±‚ã•ã‚Œã‚‹å ´åˆã®è¦åˆ¶å½“å±€ã€ç”³è«‹ç¯„å›²å†…ã®ãƒ‘ãƒ¼ãƒˆãƒŠãƒ¼æ©Ÿé–¢ãƒ»ã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼ã¨ã®ã¿ãƒ‡ãƒ¼ã‚¿ã‚’å…±æœ‰ã—ã¾ã™ã€‚',
  },
  {
    title: '7. ãƒ‡ãƒ¼ã‚¿ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£',
    body: 'ä¿å­˜ãƒ‡ãƒ¼ã‚¿ã«ã¯AES-256æš—å·åŒ–ã‚’ä½¿ç”¨ã€‚é€šä¿¡ã¯HTTPS ã§ä¿è­·ã€‚å½¹å‰²ãƒ™ãƒ¼ã‚¹ã®ã‚¢ã‚¯ã‚»ã‚¹åˆ¶å¾¡ã«ã‚ˆã‚Šã€ã‚¹ã‚¿ãƒƒãƒ•ã¯æ¥­å‹™ã«å¿…è¦ãªãƒ‡ãƒ¼ã‚¿ã®ã¿ã«ã‚¢ã‚¯ã‚»ã‚¹ã§ãã¾ã™ã€‚å®šæœŸçš„ãªã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£ç›£æŸ»ã‚’å®Ÿæ–½ã—ã¦ã„ã¾ã™ã€‚',
  },
  {
    title: '8. ãƒ‡ãƒ¼ã‚¿ä¿æŒæœŸé–“',
    body: 'ã‚¢ã‚«ã‚¦ãƒ³ãƒˆãŒæœ‰åŠ¹ãªé–“ã€ã‚¢ã‚«ã‚¦ãƒ³ãƒˆãƒ‡ãƒ¼ã‚¿ã‚’ä¿æŒã—ã¾ã™ã€‚ã‚¢ã‚«ã‚¦ãƒ³ãƒˆå‰Šé™¤å¾Œã€åŒ¿ååŒ–ãƒ‡ãƒ¼ã‚¿ã¯åˆ†æžã¨æ³•çš„éµå®ˆã®ãŸã‚æœ€å¤§3å¹´é–“ä¿æŒã•ã‚Œã‚‹å ´åˆãŒã‚ã‚Šã¾ã™ã€‚',
  },
  {
    title: '9. ãŠå®¢æ§˜ã®æ¨©åˆ©',
    body: 'ä¿æœ‰ã™ã‚‹å€‹äººãƒ‡ãƒ¼ã‚¿ã¸ã®ã‚¢ã‚¯ã‚»ã‚¹ã€ä¸æ­£ç¢ºãªãƒ‡ãƒ¼ã‚¿ã®è¨‚æ­£è«‹æ±‚ã€ã‚¢ã‚«ã‚¦ãƒ³ãƒˆãŠã‚ˆã³ãƒ‡ãƒ¼ã‚¿ã®å‰Šé™¤è«‹æ±‚ã€éžå¿…é ˆãƒ‡ãƒ¼ã‚¿å‡¦ç†ã¸ã®åŒæ„æ’¤å›žã®æ¨©åˆ©ãŒã‚ã‚Šã¾ã™ã€‚è¡Œä½¿ã™ã‚‹ã«ã¯ support@tensai.com ã«ãŠå•ã„åˆã‚ã›ãã ã•ã„ã€‚',
  },
  {
    title: '10. Cookieã¨ãƒˆãƒ©ãƒƒã‚­ãƒ³ã‚°',
    body: 'ã‚»ãƒƒã‚·ãƒ§ãƒ³ç¶­æŒã¨è¨€èªžè¨­å®šä¿å­˜ã®ãŸã‚ã«Cookieã‚’ä½¿ç”¨ã—ã¾ã™ã€‚ç¬¬ä¸‰è€…ã®åºƒå‘ŠCookieã¯ä½¿ç”¨ã—ã¾ã›ã‚“ã€‚ãƒ–ãƒ©ã‚¦ã‚¶è¨­å®šã§Cookieã‚’ç„¡åŠ¹ã«ã§ãã¾ã™ãŒã€ä¸€éƒ¨æ©Ÿèƒ½ãŒæ­£å¸¸ã«å‹•ä½œã—ãªã„å ´åˆãŒã‚ã‚Šã¾ã™ã€‚',
  },
  {
    title: '11. æœªæˆå¹´è€…ã®ãƒ—ãƒ©ã‚¤ãƒã‚·ãƒ¼',
    body: 'Tensaiã¯ä¿è­·è€…ã®åŒæ„ãªã—ã«18æ­³æœªæº€ã®æ–¹ã®åˆ©ç”¨ã‚’æƒ³å®šã—ã¦ã„ã¾ã›ã‚“ã€‚æœªæˆå¹´è€…ã®ãƒ‡ãƒ¼ã‚¿ã¨åˆ¤æ˜Žã—ãŸå ´åˆã¯ç›´ã¡ã«å‰Šé™¤ã—ã¾ã™ã€‚',
  },
  {
    title: '12. ãƒãƒªã‚·ãƒ¼ã®å¤‰æ›´',
    body: 'æœ¬ãƒ—ãƒ©ã‚¤ãƒã‚·ãƒ¼ãƒãƒªã‚·ãƒ¼ã¯éšæ™‚æ›´æ–°ã•ã‚Œã‚‹å ´åˆãŒã‚ã‚Šã¾ã™ã€‚é‡è¦ãªå¤‰æ›´ã¯ãƒ¡ãƒ¼ãƒ«ã¾ãŸã¯ãƒ—ãƒ©ãƒƒãƒˆãƒ•ã‚©ãƒ¼ãƒ å†…é€šçŸ¥ã§ãŠçŸ¥ã‚‰ã›ã—ã¾ã™ã€‚',
  },
  {
    title: '13. ãŠå•ã„åˆã‚ã›',
    body: 'æœ¬ãƒ—ãƒ©ã‚¤ãƒã‚·ãƒ¼ãƒãƒªã‚·ãƒ¼ã«é–¢ã™ã‚‹ã”è³ªå•ã¯ support@tensai.com ã¾ã§ãŠå•ã„åˆã‚ã›ãã ã•ã„ã€‚',
  },
];

const HIGHLIGHTS = [
  { icon: 'ðŸ”’', label: 'AES-256 Encrypted', labelJa: 'AES-256æš—å·åŒ–' },
  { icon: 'ðŸš«', label: 'Never Sold', labelJa: 'è²©å£²ãªã—' },
  { icon: 'ðŸ‘ï¸', label: 'Contact Info Masked', labelJa: 'é€£çµ¡å…ˆéžè¡¨ç¤º' },
  { icon: 'ðŸ“‹', label: 'Full Audit Trail', labelJa: 'å®Œå…¨ç›£æŸ»è¨¼è·¡' },
];

export default function PrivacyPage() {
  const { t, lang, toggle } = useLang();
  const l = t.landing;
  const ja = lang === 'ja';
  const sections = ja ? SECTIONS_JA : SECTIONS_EN;

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
            <Link href="/auth/login" className="text-sm text-slate-600 hover:text-green-800 transition-colors px-2 py-1">
              {l.login}
            </Link>
            <Link href="/auth/register" className="text-sm bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-full font-medium transition-colors">
              {l.getStarted}
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-green-700 text-white py-12 sm:py-16 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            ðŸ›¡ï¸ {ja ? 'ãƒ—ãƒ©ã‚¤ãƒã‚·ãƒ¼ãƒãƒªã‚·ãƒ¼' : 'Privacy Policy'}
          </div>
          <h1 className="text-fluid-4xl font-bold mb-3">
            {ja ? 'ãƒ—ãƒ©ã‚¤ãƒã‚·ãƒ¼ãƒãƒªã‚·ãƒ¼' : 'Privacy Policy'}
          </h1>
          <p className="text-green-200 text-sm">
            {ja ? 'æœ€çµ‚æ›´æ–°ï¼š2026å¹´1æœˆ' : 'Last updated: January 2026'}
          </p>
        </div>
      </div>

      {/* Highlights */}
      <div className="bg-green-50 border-b border-green-100 py-5">
        <div className="max-w-3xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {HIGHLIGHTS.map((h) => (
              <div key={h.label} className="flex flex-col items-center gap-1.5">
                <span className="text-2xl">{h.icon}</span>
                <span className="text-xs font-semibold text-green-800">{ja ? h.labelJa : h.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <p className="text-slate-500 text-sm mb-10 leading-relaxed border-l-4 border-green-600 pl-4">
          {ja
            ? 'ã‚ãªãŸã®ãƒ—ãƒ©ã‚¤ãƒã‚·ãƒ¼ã¯ç§ãŸã¡ã«ã¨ã£ã¦é‡è¦ã§ã™ã€‚Tensaiã¯ãƒ—ãƒ©ãƒƒãƒˆãƒ•ã‚©ãƒ¼ãƒ ã®ä¿¡é ¼æ€§ã®åŸºç›¤ã¨ã—ã¦ã€ãƒ‡ãƒ¼ã‚¿ä¿è­·ã‚’è¨­è¨ˆã®ä¸­å¿ƒã«ç½®ã„ã¦ã„ã¾ã™ã€‚'
            : "Your privacy matters to us. Tensai is built on trust â€” data protection is not an afterthought, it's central to how the platform works."}
        </p>

        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-base font-bold text-slate-900 mb-2">{s.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <Link href="/" className="inline-flex items-center justify-center gap-2 border border-slate-200 hover:border-green-300 text-slate-700 hover:text-green-800 px-6 py-2.5 rounded-full text-sm font-medium transition-colors">
            â† {ja ? 'ãƒ›ãƒ¼ãƒ ã«æˆ»ã‚‹' : 'Back to Home'}
          </Link>
          <Link href="/terms" className="inline-flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors">
            {ja ? 'åˆ©ç”¨è¦ç´„ã‚’èª­ã‚€ â†’' : 'Read Terms & Conditions â†’'}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 sm:py-8 text-center text-sm text-slate-400">
        {l.footer}
      </footer>
    </div>
  );
}

