'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const SECTIONS_EN = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account or using the Tensai platform in any way, you agree to these Terms and Conditions. If you do not agree, do not use the platform. These terms apply to all users — students, agencies, institutions, and affiliates.',
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
    body: 'Student profiles are locked after admin verification. Once locked, profile data cannot be edited without a formal review request. This is by design — to prevent document fraud. Any attempt to submit false documents is grounds for permanent account termination and may be reported to relevant authorities.',
  },
  {
    title: '5. Lead Ownership & Sharing',
    body: "Leads added by an agency to their Private Vault remain exclusively owned by that agency. Leads shared to the Open Pool are subject to Tensai's lead-sharing policy. Tensai reserves the right to moderate and remove leads that violate platform rules. Inter-agency lead transfers are final once accepted.",
  },
  {
    title: '6. Payments & Fees',
    body: 'All fees (service charges, unlock fees, commissions) are clearly stated before any transaction. Payments made through the Tensai platform are processed securely. Refund eligibility depends on the service stage — refer to our Refund Policy. Tensai uses an escrow model to protect student payments until milestone conditions are met.',
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
    title: '1. 利用規約の同意',
    body: 'Tensaiプラットフォームのアカウント作成または利用により、本利用規約に同意したものとみなします。同意しない場合はご利用いただけません。本規約は学生・エージェンシー・教育機関・アフィリエイトすべてのユーザーに適用されます。',
  },
  {
    title: '2. 利用資格',
    body: '18歳以上、または保護者の同意を得た方のみご利用いただけます。エージェンシー・教育機関アカウントには認証済みのビジネス資格が必要です。当社は基準を満たさないアカウントを拒否・削除する権利を有します。',
  },
  {
    title: '3. アカウントの責任',
    body: 'ログイン情報の管理はご自身の責任です。アカウント上のすべての活動はアカウント所有者の責任となります。不正アクセスが疑われる場合は直ちにご連絡ください。',
  },
  {
    title: '4. 書類認証とプロフィールロック',
    body: '学生プロフィールは管理者認証後にロックされます。ロック後のデータ編集には正式なレビューリクエストが必要です。虚偽の書類提出はアカウントの永久停止および当局への報告対象となります。',
  },
  {
    title: '5. リードの所有権と共有',
    body: 'エージェンシーがプライベート保管庫に追加したリードはそのエージェンシーの専有財産です。オープンプールに共有されたリードはTensaiのリード共有ポリシーに従います。',
  },
  {
    title: '6. 支払いと手数料',
    body: 'すべての手数料はトランザクション前に明示されます。Tensaiはエスクローモデルを使用し、マイルストーン条件が満たされるまで学生の支払いを保護します。',
  },
  {
    title: '7. 禁止事項',
    body: '偽造書類の提出、制限回避のための複数アカウント作成、他のユーザーへの詐欺・嫌がらせ、プラットフォームのスクレイピング、コンタクトペーパーシステム外での学生への直接連絡は禁止されています。',
  },
  {
    title: '8. サービスの可用性',
    body: 'Tensaiは高可用性を目指しますが、継続的なサービスを保証するものではありません。メンテナンスや更新のためサービスを一時停止する場合があります。',
  },
  {
    title: '9. 知的財産',
    body: 'プラットフォームのコンテンツ、ブランド、コード、デザインはすべてTensaiに帰属します。書面による許可なく複製・配布することはできません。',
  },
  {
    title: '10. アカウント停止',
    body: '規約違反、不正行為、またはプラットフォームや他のユーザーに害を与える行為があった場合、Tensaiはアカウントを停止・削除する権利を有します。',
  },
  {
    title: '11. 責任の制限',
    body: 'Tensaiはビザ申請結果、入学決定、または第三者の行為について責任を負いません。当社の責任は当該サービスに対して支払われた手数料に限定されます。',
  },
  {
    title: '12. 規約の変更',
    body: '本規約はいつでも更新される場合があります。変更後のプラットフォーム利用は新しい規約への同意とみなします。',
  },
  {
    title: '13. 準拠法',
    body: '本規約はバングラデシュの法律に準拠します。紛争はダッカの裁判所または仲裁により解決されます。',
  },
  {
    title: '14. お問い合わせ',
    body: '本規約に関するご質問は support@tensai.com までお問い合わせください。',
  },
];

const SECTIONS_BN = [
  {
    title: '১. শর্তাবলী গ্রহণ',
    body: 'টেনসাই প্ল্যাটফর্মে অ্যাকাউন্ট তৈরি বা যেকোনোভাবে ব্যবহার করলে আপনি এই শর্তাবলীতে সম্মত হন। সম্মত না হলে প্ল্যাটফর্ম ব্যবহার করবেন না। এই শর্তাবলী শিক্ষার্থী, এজেন্সি, প্রতিষ্ঠান ও অ্যাফিলিয়েট — সকল ব্যবহারকারীর জন্য প্রযোজ্য।',
  },
  {
    title: '২. ব্যবহারযোগ্যতা',
    body: 'টেনসাই ব্যবহার করতে হলে আপনার বয়স কমপক্ষে ১৮ বছর হতে হবে বা অভিভাবকের সম্মতি থাকতে হবে। এজেন্সি ও প্রতিষ্ঠান অ্যাকাউন্টের জন্য যাচাইকৃত ব্যবসায়িক সনদ প্রয়োজন।',
  },
  {
    title: '৩. অ্যাকাউন্টের দায়িত্ব',
    body: 'লগইন তথ্যের গোপনীয়তা রক্ষার দায়িত্ব আপনার। আপনার অ্যাকাউন্টের অধীনে সব কার্যক্রমের দায় আপনার। অননুমোদিত প্রবেশের সন্দেহ হলে অবিলম্বে যোগাযোগ করুন।',
  },
  {
    title: '৪. ডকুমেন্ট যাচাই ও লক করা প্রোফাইল',
    body: 'অ্যাডমিন যাচাইয়ের পর শিক্ষার্থীর প্রোফাইল লক হয়ে যায়। লক হওয়ার পর আনুষ্ঠানিক রিভিউ অনুরোধ ছাড়া তথ্য সম্পাদনা করা যাবে না। মিথ্যা ডকুমেন্ট জমা দেওয়া স্থায়ী অ্যাকাউন্ট বাতিল ও কর্তৃপক্ষকে রিপোর্টের কারণ হতে পারে।',
  },
  {
    title: '৫. লিড মালিকানা ও শেয়ারিং',
    body: 'এজেন্সি প্রাইভেট ভল্টে যোগ করা লিড সেই এজেন্সির একচেটিয়া সম্পত্তি। ওপেন পুলে শেয়ার করা লিড টেনসাইয়ের লিড-শেয়ারিং নীতি মেনে চলে।',
  },
  {
    title: '৬. পেমেন্ট ও ফি',
    body: 'সকল ফি যেকোনো লেনদেনের আগে স্পষ্টভাবে জানানো হয়। টেনসাই এসক্রো মডেল ব্যবহার করে মাইলস্টোন শর্ত পূরণ না হওয়া পর্যন্ত শিক্ষার্থীর পেমেন্ট সুরক্ষিত রাখে।',
  },
  {
    title: '৭. নিষিদ্ধ কার্যক্রম',
    body: 'জাল বা পরিবর্তিত ডকুমেন্ট জমা, সীমাবদ্ধতা এড়াতে একাধিক অ্যাকাউন্ট তৈরি, অন্য ব্যবহারকারীদের প্রতারণা বা হয়রানি, প্ল্যাটফর্ম স্ক্র্যাপিং এবং কন্টাক্ট পেপার সিস্টেমের বাইরে শিক্ষার্থীদের সাথে সরাসরি যোগাযোগ নিষিদ্ধ।',
  },
  {
    title: '৮. প্ল্যাটফর্মের প্রাপ্যতা',
    body: 'টেনসাই উচ্চ প্রাপ্যতার লক্ষ্য রাখে তবে নিরবচ্ছিন্ন সেবার নিশ্চয়তা দেয় না। রক্ষণাবেক্ষণ বা নিরাপত্তার কারণে পরিষেবা সাময়িকভাবে স্থগিত হতে পারে।',
  },
  {
    title: '৯. মেধাসত্ত্ব',
    body: 'প্ল্যাটফর্মের সমস্ত বিষয়বস্তু, ব্র্যান্ডিং, কোড ও ডিজাইন টেনসাইয়ের। লিখিত অনুমতি ছাড়া কপি, পুনরুৎপাদন বা পুনর্বিতরণ করা যাবে না।',
  },
  {
    title: '১০. অ্যাকাউন্ট বাতিল',
    body: 'শর্ত লঙ্ঘন, প্রতারণামূলক কার্যক্রম বা প্ল্যাটফর্ম ও ব্যবহারকারীদের ক্ষতিকর আচরণের ক্ষেত্রে টেনসাই যেকোনো সময় অ্যাকাউন্ট স্থগিত বা মুছে ফেলার অধিকার রাখে।',
  },
  {
    title: '১১. দায়বদ্ধতার সীমা',
    body: 'টেনসাই ভিসা আবেদনের ফলাফল, ভর্তির সিদ্ধান্ত বা তৃতীয় পক্ষের কার্যক্রমের জন্য দায়ী নয়। আমাদের দায় সংশ্লিষ্ট পরিষেবার জন্য পরিশোধিত ফির মধ্যে সীমাবদ্ধ।',
  },
  {
    title: '১২. শর্তাবলীর পরিবর্তন',
    body: 'আমরা যেকোনো সময় এই শর্তাবলী আপডেট করতে পারি। পরিবর্তনের পরেও প্ল্যাটফর্ম ব্যবহার মানে নতুন শর্তাবলীতে সম্মতি।',
  },
  {
    title: '১৩. প্রযোজ্য আইন',
    body: 'এই শর্তাবলী বাংলাদেশের আইন দ্বারা পরিচালিত। বিরোধ ঢাকার আদালত বা মধ্যস্থতার মাধ্যমে নিষ্পত্তি হবে।',
  },
  {
    title: '১৪. যোগাযোগ',
    body: 'এই শর্তাবলী সম্পর্কে প্রশ্নের জন্য: support@tensai.com',
  },
];

export default function TermsPage() {
  const { t, lang, toggle } = useLang();
  const l = t.landing;
  const ja = lang === 'ja';
  const bn = lang === 'bn';
  const sections = ja ? SECTIONS_JA : bn ? SECTIONS_BN : SECTIONS_EN;

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const termsText = ja ? '利用規約'   : bn ? 'শর্তাবলী'  : 'Terms';
  const privText  = ja ? 'プライバシー' : bn ? 'প্রাইভেসি' : 'Privacy';

  return (
    <div className="min-h-screen bg-[#0d1117]">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-nav' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/tensai-logo.png" alt="Tensai" width={36} height={36} className="rounded-full object-contain" />
            <div>
              <div className="text-base font-bold text-white tracking-tight leading-none">Tensai</div>
              <div className="text-[9px] text-white/35 tracking-wider leading-none mt-0.5 hidden sm:block">THE WAY OF GLOBAL CAREER</div>
            </div>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={toggle} className="text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10 text-white/60 hover:border-green-500/40 hover:text-green-400 transition-all">
              {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
            </button>
            <Link href="/auth/login"    className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5">{l.login}</Link>
            <Link href="/auth/register" className="text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full font-semibold transition-all glow-green">{l.getStarted}</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pt-32 pb-14 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-green-600/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            {'📄'} {ja ? '利用規約' : bn ? 'শর্তাবলী' : 'Terms & Conditions'}
          </div>
          <h1 className="text-fluid-4xl font-black text-white tracking-tight mb-3 leading-tight">
            {ja ? '利用規約' : bn ? 'শর্তাবলী ও শর্তসমূহ' : 'Terms & Conditions'}
          </h1>
          <p className="text-white/35 text-xs">
            {ja ? '最終更新：2026年1月' : bn ? 'সর্বশেষ আপডেট: জানুয়ারি ২০২৬' : 'Last updated: January 2026'}
          </p>
        </div>
      </section>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pb-16">

        {/* Intro callout */}
        <div className="glass-card rounded-2xl p-5 mb-10 border-l-4 border-green-500/60">
          <p className="text-white/55 text-sm leading-relaxed">
            {ja
              ? 'Tensai Language & Study Consultancy（以下「Tensai」）が提供するプラットフォームをご利用いただく前に、以下の利用規約をよくお読みください。'
              : bn
              ? 'টেনসাই প্ল্যাটফর্ম ব্যবহার করার আগে অনুগ্রহ করে এই শর্তাবলী মনোযোগ দিয়ে পড়ুন।'
              : 'Please read these Terms and Conditions carefully before using the Tensai platform operated by Tensai Language & Study Consultancy.'}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((s, i) => (
            <div key={s.title} className="glass-card rounded-2xl p-6 card-hover-glow transition-all">
              <div className="flex items-start gap-4">
                <span className="shrink-0 w-7 h-7 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black flex items-center justify-center mt-0.5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white mb-2 leading-snug">{s.title}</h2>
                  <p className="text-xs text-white/50 leading-relaxed">{s.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link href="/" className="flex-1 inline-flex items-center justify-center gap-2 glass-card border border-white/10 hover:border-white/25 text-white/65 hover:text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all">
            ← {ja ? 'ホームに戻る' : bn ? 'হোমে ফিরুন' : 'Back to Home'}
          </Link>
          <Link href="/privacy" className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all glow-green">
            {ja ? 'プライバシーポリシーを読む →' : bn ? 'প্রাইভেসি নীতি পড়ুন →' : 'Read Privacy Policy →'}
          </Link>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-8 px-4 bg-alt-section">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/tensai-logo.png" alt="Tensai" width={26} height={26} className="rounded-full object-contain" />
            <span className="text-sm font-bold text-white/70">Tensai</span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/35">
            <Link href="/terms"   className="text-green-400 font-medium">{termsText}</Link>
            <Link href="/privacy" className="hover:text-white/60 transition-colors">{privText}</Link>
          </div>
          <p className="text-xs text-white/30">{l.footer}</p>
        </div>
      </footer>

    </div>
  );
}
