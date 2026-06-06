'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';

const SECTIONS_EN = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account or using the Tensai platform in any way, you agree to these Terms and Conditions. If you do not agree, do not use the platform. These terms apply to all users â€” students, agencies, institutions, and affiliates.',
  },
  {
    title: '2. Who Can Use Tensai',
    body: 'You must be at least 18 years old or have parental/guardian consent to use Tensai. Agency and institution accounts require verified business credentials. We reserve the right to reject or remove any account that does not meet our verification standards.',
  },
  {
    title: '3. Account Responsibilities',
    body: 'You are responsible for maintaining the confidentiality of your login credentials. Any activity under your account is your responsibility. If you suspect unauthorized access, contact us immediately. Do not share your account with others.',
  },
  {
    title: '4. Document Verification & Locked Profiles',
    body: 'Student profiles are locked after admin verification. Once locked, profile data cannot be edited without a formal review request. This is by design â€” to prevent document fraud. Any attempt to submit false documents is grounds for permanent account termination and may be reported to relevant authorities.',
  },
  {
    title: '5. Lead Ownership & Sharing',
    body: 'Leads added by an agency to their Private Vault remain exclusively owned by that agency. Leads shared to the Open Pool are subject to Tensai\'s lead-sharing policy. Tensai reserves the right to moderate and remove leads that violate platform rules. Inter-agency lead transfers are final once accepted.',
  },
  {
    title: '6. Payments & Fees',
    body: 'All fees (service charges, unlock fees, commissions) are clearly stated before any transaction. Payments made through the Tensai platform are processed securely. Refund eligibility depends on the service stage â€” refer to our Refund Policy. Tensai uses an escrow model to protect student payments until milestone conditions are met.',
  },
  {
    title: '7. Prohibited Conduct',
    body: 'You must not: submit forged or altered documents; create multiple accounts to bypass restrictions; use the platform to harass, defraud, or mislead other users; attempt to reverse-engineer or scrape the platform; contact students directly outside of the Tensai contact paper system.',
  },
  {
    title: '8. Platform Availability',
    body: 'Tensai aims for high availability but does not guarantee uninterrupted service. We may perform maintenance, updates, or suspend access for security reasons without prior notice. We are not liable for losses caused by temporary downtime.',
  },
  {
    title: '9. Intellectual Property',
    body: 'All platform content, branding, code, and design belong to Tensai. You may not copy, reproduce, or redistribute any part of the platform without written permission. Student documents remain the property of the respective student.',
  },
  {
    title: '10. Termination',
    body: 'Tensai may suspend or terminate any account at any time for violation of these terms, fraudulent activity, or any conduct that harms the platform or its users. You may close your account at any time by contacting support.',
  },
  {
    title: '11. Limitation of Liability',
    body: 'Tensai is a platform that facilitates connections between students, agencies, and institutions. We are not responsible for the outcome of visa applications, admissions decisions, or any third-party actions. Our liability is limited to the fees paid to Tensai for the specific service in question.',
  },
  {
    title: '12. Changes to Terms',
    body: 'We may update these Terms at any time. Continued use of the platform after changes means you accept the new terms. Major changes will be communicated via email or in-platform notification.',
  },
  {
    title: '13. Governing Law',
    body: 'These Terms are governed by the laws of Bangladesh. Any disputes will be resolved through arbitration or in the courts of Dhaka, Bangladesh.',
  },
  {
    title: '14. Contact',
    body: 'For questions about these Terms, contact us at: support@tensai.com',
  },
];

const SECTIONS_JA = [
  {
    title: '1. åˆ©ç”¨è¦ç´„ã®åŒæ„',
    body: 'Tensaiãƒ—ãƒ©ãƒƒãƒˆãƒ•ã‚©ãƒ¼ãƒ ã®ã‚¢ã‚«ã‚¦ãƒ³ãƒˆä½œæˆã¾ãŸã¯åˆ©ç”¨ã«ã‚ˆã‚Šã€æœ¬åˆ©ç”¨è¦ç´„ã«åŒæ„ã—ãŸã‚‚ã®ã¨ã¿ãªã—ã¾ã™ã€‚åŒæ„ã—ãªã„å ´åˆã¯ã”åˆ©ç”¨ã„ãŸã ã‘ã¾ã›ã‚“ã€‚æœ¬è¦ç´„ã¯å­¦ç”Ÿãƒ»ã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼ãƒ»æ•™è‚²æ©Ÿé–¢ãƒ»ã‚¢ãƒ•ã‚£ãƒªã‚¨ã‚¤ãƒˆã™ã¹ã¦ã®ãƒ¦ãƒ¼ã‚¶ãƒ¼ã«é©ç”¨ã•ã‚Œã¾ã™ã€‚',
  },
  {
    title: '2. åˆ©ç”¨è³‡æ ¼',
    body: '18æ­³ä»¥ä¸Šã€ã¾ãŸã¯ä¿è­·è€…ã®åŒæ„ã‚’å¾—ãŸæ–¹ã®ã¿ã”åˆ©ç”¨ã„ãŸã ã‘ã¾ã™ã€‚ã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼ãƒ»æ•™è‚²æ©Ÿé–¢ã‚¢ã‚«ã‚¦ãƒ³ãƒˆã«ã¯èªè¨¼æ¸ˆã¿ã®ãƒ“ã‚¸ãƒã‚¹è³‡æ ¼ãŒå¿…è¦ã§ã™ã€‚å½“ç¤¾ã¯åŸºæº–ã‚’æº€ãŸã•ãªã„ã‚¢ã‚«ã‚¦ãƒ³ãƒˆã‚’æ‹’å¦ãƒ»å‰Šé™¤ã™ã‚‹æ¨©åˆ©ã‚’æœ‰ã—ã¾ã™ã€‚',
  },
  {
    title: '3. ã‚¢ã‚«ã‚¦ãƒ³ãƒˆã®è²¬ä»»',
    body: 'ãƒ­ã‚°ã‚¤ãƒ³æƒ…å ±ã®ç®¡ç†ã¯ã”è‡ªèº«ã®è²¬ä»»ã§ã™ã€‚ã‚¢ã‚«ã‚¦ãƒ³ãƒˆä¸Šã®ã™ã¹ã¦ã®æ´»å‹•ã¯ã‚¢ã‚«ã‚¦ãƒ³ãƒˆæ‰€æœ‰è€…ã®è²¬ä»»ã¨ãªã‚Šã¾ã™ã€‚ä¸æ­£ã‚¢ã‚¯ã‚»ã‚¹ãŒç–‘ã‚ã‚Œã‚‹å ´åˆã¯ç›´ã¡ã«ã”é€£çµ¡ãã ã•ã„ã€‚',
  },
  {
    title: '4. æ›¸é¡žèªè¨¼ã¨ãƒ—ãƒ­ãƒ•ã‚£ãƒ¼ãƒ«ãƒ­ãƒƒã‚¯',
    body: 'å­¦ç”Ÿãƒ—ãƒ­ãƒ•ã‚£ãƒ¼ãƒ«ã¯ç®¡ç†è€…èªè¨¼å¾Œã«ãƒ­ãƒƒã‚¯ã•ã‚Œã¾ã™ã€‚ãƒ­ãƒƒã‚¯å¾Œã®ãƒ‡ãƒ¼ã‚¿ç·¨é›†ã«ã¯æ­£å¼ãªãƒ¬ãƒ“ãƒ¥ãƒ¼ãƒªã‚¯ã‚¨ã‚¹ãƒˆãŒå¿…è¦ã§ã™ã€‚è™šå½ã®æ›¸é¡žæå‡ºã¯ã‚¢ã‚«ã‚¦ãƒ³ãƒˆã®æ°¸ä¹…åœæ­¢ãŠã‚ˆã³å½“å±€ã¸ã®å ±å‘Šå¯¾è±¡ã¨ãªã‚Šã¾ã™ã€‚',
  },
  {
    title: '5. ãƒªãƒ¼ãƒ‰ã®æ‰€æœ‰æ¨©ã¨å…±æœ‰',
    body: 'ã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼ãŒãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆä¿ç®¡åº«ã«è¿½åŠ ã—ãŸãƒªãƒ¼ãƒ‰ã¯ãã®ã‚¨ãƒ¼ã‚¸ã‚§ãƒ³ã‚·ãƒ¼ã®å°‚æœ‰è²¡ç”£ã§ã™ã€‚ã‚ªãƒ¼ãƒ—ãƒ³ãƒ—ãƒ¼ãƒ«ã«å…±æœ‰ã•ã‚ŒãŸãƒªãƒ¼ãƒ‰ã¯Tensaiã®ãƒªãƒ¼ãƒ‰å…±æœ‰ãƒãƒªã‚·ãƒ¼ã«å¾“ã„ã¾ã™ã€‚',
  },
  {
    title: '6. æ”¯æ‰•ã„ã¨æ‰‹æ•°æ–™',
    body: 'ã™ã¹ã¦ã®æ‰‹æ•°æ–™ã¯ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³å‰ã«æ˜Žç¤ºã•ã‚Œã¾ã™ã€‚Tensaiã¯ã‚¨ã‚¹ã‚¯ãƒ­ãƒ¼ãƒ¢ãƒ‡ãƒ«ã‚’ä½¿ç”¨ã—ã€ãƒžã‚¤ãƒ«ã‚¹ãƒˆãƒ¼ãƒ³æ¡ä»¶ãŒæº€ãŸã•ã‚Œã‚‹ã¾ã§å­¦ç”Ÿã®æ”¯æ‰•ã„ã‚’ä¿è­·ã—ã¾ã™ã€‚',
  },
  {
    title: '7. ç¦æ­¢äº‹é …',
    body: 'å½é€ æ›¸é¡žã®æå‡ºã€åˆ¶é™å›žé¿ã®ãŸã‚ã®è¤‡æ•°ã‚¢ã‚«ã‚¦ãƒ³ãƒˆä½œæˆã€ä»–ã®ãƒ¦ãƒ¼ã‚¶ãƒ¼ã¸ã®è©æ¬ºãƒ»å«ŒãŒã‚‰ã›ã€ãƒ—ãƒ©ãƒƒãƒˆãƒ•ã‚©ãƒ¼ãƒ ã®ã‚¹ã‚¯ãƒ¬ã‚¤ãƒ”ãƒ³ã‚°ã€ã‚³ãƒ³ã‚¿ã‚¯ãƒˆãƒšãƒ¼ãƒ‘ãƒ¼ã‚·ã‚¹ãƒ†ãƒ å¤–ã§ã®å­¦ç”Ÿã¸ã®ç›´æŽ¥é€£çµ¡ã¯ç¦æ­¢ã•ã‚Œã¦ã„ã¾ã™ã€‚',
  },
  {
    title: '8. ã‚µãƒ¼ãƒ“ã‚¹ã®å¯ç”¨æ€§',
    body: 'Tensaiã¯é«˜å¯ç”¨æ€§ã‚’ç›®æŒ‡ã—ã¾ã™ãŒã€ç¶™ç¶šçš„ãªã‚µãƒ¼ãƒ“ã‚¹ã‚’ä¿è¨¼ã™ã‚‹ã‚‚ã®ã§ã¯ã‚ã‚Šã¾ã›ã‚“ã€‚ãƒ¡ãƒ³ãƒ†ãƒŠãƒ³ã‚¹ã‚„æ›´æ–°ã®ãŸã‚ã‚µãƒ¼ãƒ“ã‚¹ã‚’ä¸€æ™‚åœæ­¢ã™ã‚‹å ´åˆãŒã‚ã‚Šã¾ã™ã€‚',
  },
  {
    title: '9. çŸ¥çš„è²¡ç”£',
    body: 'ãƒ—ãƒ©ãƒƒãƒˆãƒ•ã‚©ãƒ¼ãƒ ã®ã‚³ãƒ³ãƒ†ãƒ³ãƒ„ã€ãƒ–ãƒ©ãƒ³ãƒ‰ã€ã‚³ãƒ¼ãƒ‰ã€ãƒ‡ã‚¶ã‚¤ãƒ³ã¯ã™ã¹ã¦Tensaiã«å¸°å±žã—ã¾ã™ã€‚æ›¸é¢ã«ã‚ˆã‚‹è¨±å¯ãªãè¤‡è£½ãƒ»é…å¸ƒã™ã‚‹ã“ã¨ã¯ã§ãã¾ã›ã‚“ã€‚',
  },
  {
    title: '10. ã‚¢ã‚«ã‚¦ãƒ³ãƒˆåœæ­¢',
    body: 'è¦ç´„é•åã€ä¸æ­£è¡Œç‚ºã€ã¾ãŸã¯ãƒ—ãƒ©ãƒƒãƒˆãƒ•ã‚©ãƒ¼ãƒ ã‚„ä»–ã®ãƒ¦ãƒ¼ã‚¶ãƒ¼ã«å®³ã‚’ä¸Žãˆã‚‹è¡Œç‚ºãŒã‚ã£ãŸå ´åˆã€Tensaiã¯ã‚¢ã‚«ã‚¦ãƒ³ãƒˆã‚’åœæ­¢ãƒ»å‰Šé™¤ã™ã‚‹æ¨©åˆ©ã‚’æœ‰ã—ã¾ã™ã€‚',
  },
  {
    title: '11. è²¬ä»»ã®åˆ¶é™',
    body: 'Tensaiã¯ãƒ“ã‚¶ç”³è«‹çµæžœã€å…¥å­¦æ±ºå®šã€ã¾ãŸã¯ç¬¬ä¸‰è€…ã®è¡Œç‚ºã«ã¤ã„ã¦è²¬ä»»ã‚’è² ã„ã¾ã›ã‚“ã€‚å½“ç¤¾ã®è²¬ä»»ã¯å½“è©²ã‚µãƒ¼ãƒ“ã‚¹ã«å¯¾ã—ã¦æ”¯æ‰•ã‚ã‚ŒãŸæ‰‹æ•°æ–™ã«é™å®šã•ã‚Œã¾ã™ã€‚',
  },
  {
    title: '12. è¦ç´„ã®å¤‰æ›´',
    body: 'æœ¬è¦ç´„ã¯ã„ã¤ã§ã‚‚æ›´æ–°ã•ã‚Œã‚‹å ´åˆãŒã‚ã‚Šã¾ã™ã€‚å¤‰æ›´å¾Œã®ãƒ—ãƒ©ãƒƒãƒˆãƒ•ã‚©ãƒ¼ãƒ åˆ©ç”¨ã¯æ–°ã—ã„è¦ç´„ã¸ã®åŒæ„ã¨ã¿ãªã—ã¾ã™ã€‚',
  },
  {
    title: '13. æº–æ‹ æ³•',
    body: 'æœ¬è¦ç´„ã¯ãƒãƒ³ã‚°ãƒ©ãƒ‡ã‚·ãƒ¥ã®æ³•å¾‹ã«æº–æ‹ ã—ã¾ã™ã€‚ç´›äº‰ã¯ãƒ€ãƒƒã‚«ã®è£åˆ¤æ‰€ã¾ãŸã¯ä»²è£ã«ã‚ˆã‚Šè§£æ±ºã•ã‚Œã¾ã™ã€‚',
  },
  {
    title: '14. ãŠå•ã„åˆã‚ã›',
    body: 'æœ¬è¦ç´„ã«é–¢ã™ã‚‹ã”è³ªå•ã¯ support@tensai.com ã¾ã§ãŠå•ã„åˆã‚ã›ãã ã•ã„ã€‚',
  },
];

export default function TermsPage() {
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
      <div className="bg-slate-900 text-white py-12 sm:py-16 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            ðŸ“„ {ja ? 'åˆ©ç”¨è¦ç´„' : 'Terms & Conditions'}
          </div>
          <h1 className="text-fluid-4xl font-bold mb-3">
            {ja ? 'åˆ©ç”¨è¦ç´„' : 'Terms & Conditions'}
          </h1>
          <p className="text-slate-400 text-sm">
            {ja ? 'æœ€çµ‚æ›´æ–°ï¼š2026å¹´1æœˆ' : 'Last updated: January 2026'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <p className="text-slate-500 text-sm mb-10 leading-relaxed border-l-4 border-green-600 pl-4">
          {ja
            ? 'Tensai Language & Study Consultancyï¼ˆä»¥ä¸‹ã€ŒTensaiã€ï¼‰ãŒæä¾›ã™ã‚‹ãƒ—ãƒ©ãƒƒãƒˆãƒ•ã‚©ãƒ¼ãƒ ã‚’ã”åˆ©ç”¨ã„ãŸã ãå‰ã«ã€ä»¥ä¸‹ã®åˆ©ç”¨è¦ç´„ã‚’ã‚ˆããŠèª­ã¿ãã ã•ã„ã€‚'
            : 'Please read these Terms and Conditions carefully before using the Tensai platform operated by Tensai Language & Study Consultancy.'}
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
          <Link href="/privacy" className="inline-flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors">
            {ja ? 'ãƒ—ãƒ©ã‚¤ãƒã‚·ãƒ¼ãƒãƒªã‚·ãƒ¼ã‚’èª­ã‚€ â†’' : 'Read Privacy Policy â†’'}
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

