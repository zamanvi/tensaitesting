'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const SECTIONS_EN = [
  {
    title: '1. Who We Are',
    body: 'Tensai Language & Study Consultancy operates the Tensai platform — an AI-powered education network connecting Bangladeshi students with global institutions. This Privacy Policy explains what data we collect, why we collect it, and how we protect it.',
  },
  {
    title: '2. What Data We Collect',
    body: 'We collect: (a) Account data — name, email, phone number, account type. (b) Profile data — date of birth, gender, nationality, address, academic history, emergency contacts. (c) Documents — passport scans, certificates, transcripts, and other verification documents processed via OCR. (d) Usage data — login activity, pages visited, actions taken on the platform. (e) Communication data — messages sent through the contact paper/ticket system.',
  },
  {
    title: '3. How We Use Your Data',
    body: 'Your data is used to: verify your identity and documents; match students with suitable institutions and agencies; process applications and track lead status; send platform notifications and updates; generate anonymized analytics to improve the service; comply with legal obligations.',
  },
  {
    title: '4. Document Locking & OCR Processing',
    body: 'When you upload a document, it is processed by our OCR system to extract and verify data. Once an admin verifies your profile, documents are locked — they cannot be altered, replaced, or deleted. This is a core security feature, not a limitation. Locked documents ensure the integrity of your verified profile.',
  },
  {
    title: '5. Who Can See Your Data',
    body: 'Students: your contact information (phone, email) is never shown to institutions or agencies. Institutions see your qualifications, academic scores, and language certificates only — not your identity details. Agencies assigned to your lead see your name and basic profile as needed to process your application. Tensai staff with admin access can view all data for verification and support purposes.',
  },
  {
    title: '6. Data Sharing with Third Parties',
    body: 'We do not sell your data. We may share data with: trusted technology partners who help run the platform (e.g. cloud hosting, email delivery); government or regulatory bodies if required by law; partner institutions or agencies strictly within the scope of your application. All third parties are bound by data protection agreements.',
  },
  {
    title: '7. Data Security',
    body: 'We use AES-256 encryption for stored data. All communications are secured via HTTPS. Role-based access control ensures staff only see data relevant to their function. We conduct regular security audits. Despite these measures, no system is 100% secure — we encourage you to use a strong, unique password.',
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
    title: "11. Children's Privacy",
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
    title: '1. 私たちについて',
    body: 'Tensai Language & Study Consultancyは、AIを活用した教育ネットワーク「Tensai」を運営しています。本プライバシーポリシーは、収集するデータ、収集の目的、および保護方法について説明します。',
  },
  {
    title: '2. 収集するデータ',
    body: '(a) アカウントデータ：名前、メール、電話番号、アカウント種別。(b) プロフィールデータ：生年月日、性別、国籍、住所、学歴、緊急連絡先。(c) 書類：OCRで処理されるパスポートスキャン、証明書、成績証明書。(d) 利用データ：ログイン履歴、閲覧ページ、プラットフォーム上の操作。(e) 通信データ：コンタクトペーパー/チケットシステムを通じたメッセージ。',
  },
  {
    title: '3. データの利用目的',
    body: '本人確認と書類認証、学生と適切な機関・エージェンシーのマッチング、申請処理とリードステータス追跡、プラットフォーム通知の送信、サービス改善のための匿名化分析、法的義務の遵守。',
  },
  {
    title: '4. 書類ロックとOCR処理',
    body: '書類をアップロードすると、OCRシステムがデータを抽出・検証します。管理者がプロフィールを認証すると書類はロックされ、変更・置換・削除できなくなります。これはセキュリティ機能であり、認証済みプロフィールの完全性を保証します。',
  },
  {
    title: '5. データへのアクセス権限',
    body: '学生の連絡先（電話・メール）は教育機関やエージェンシーには表示されません。教育機関は資格・学力・語学スコアのみ閲覧可能です。担当エージェンシーは申請処理に必要な範囲で名前と基本プロフィールを閲覧できます。',
  },
  {
    title: '6. 第三者へのデータ共有',
    body: '個人データを販売することはありません。クラウドホスティング・メール配信等の信頼できる技術パートナー、法律で要求される場合の規制当局、申請範囲内のパートナー機関・エージェンシーとのみデータを共有します。',
  },
  {
    title: '7. データセキュリティ',
    body: '保存データにはAES-256暗号化を使用。通信はHTTPSで保護。役割ベースのアクセス制御により、スタッフは業務に必要なデータのみにアクセスできます。定期的なセキュリティ監査を実施しています。',
  },
  {
    title: '8. データ保持期間',
    body: 'アカウントが有効な間、アカウントデータを保持します。アカウント削除後、匿名化データは分析と法的遵守のため最大3年間保持される場合があります。',
  },
  {
    title: '9. お客様の権利',
    body: '保有する個人データへのアクセス、不正確なデータの訂正請求、アカウントおよびデータの削除請求、非必須データ処理への同意撤回の権利があります。行使するには support@tensai.com にお問い合わせください。',
  },
  {
    title: '10. Cookieとトラッキング',
    body: 'セッション維持と言語設定保存のためにCookieを使用します。第三者の広告Cookieは使用しません。ブラウザ設定でCookieを無効にできますが、一部機能が正常に動作しない場合があります。',
  },
  {
    title: '11. 未成年者のプライバシー',
    body: 'Tensaiは保護者の同意なしに18歳未満の方の利用を想定していません。未成年者のデータと判明した場合は直ちに削除します。',
  },
  {
    title: '12. ポリシーの変更',
    body: '本プライバシーポリシーは随時更新される場合があります。重要な変更はメールまたはプラットフォーム内通知でお知らせします。',
  },
  {
    title: '13. お問い合わせ',
    body: '本プライバシーポリシーに関するご質問は support@tensai.com までお問い合わせください。',
  },
];

const SECTIONS_BN = [
  {
    title: '১. আমরা কারা',
    body: 'Tensai Language & Study Consultancy টেনসাই প্ল্যাটফর্ম পরিচালনা করে — একটি AI-চালিত শিক্ষা নেটওয়ার্ক যা বাংলাদেশি শিক্ষার্থীদের বৈশ্বিক প্রতিষ্ঠানের সাথে সংযুক্ত করে। এই প্রাইভেসি নীতি ব্যাখ্যা করে আমরা কী তথ্য সংগ্রহ করি, কেন করি এবং কীভাবে সুরক্ষিত রাখি।',
  },
  {
    title: '২. আমরা কী তথ্য সংগ্রহ করি',
    body: '(ক) অ্যাকাউন্ট তথ্য — নাম, ইমেইল, ফোন নম্বর, অ্যাকাউন্টের ধরন। (খ) প্রোফাইল তথ্য — জন্ম তারিখ, লিঙ্গ, জাতীয়তা, ঠিকানা, শিক্ষাগত ইতিহাস, জরুরি যোগাযোগ। (গ) কাগজপত্র — OCR-প্রক্রিয়াকৃত পাসপোর্ট স্ক্যান, সার্টিফিকেট, ট্রান্সক্রিপ্ট। (ঘ) ব্যবহারের তথ্য — লগইন কার্যক্রম, পরিদর্শিত পেজ। (ঙ) যোগাযোগের তথ্য — কন্টাক্ট পেপার/টিকেট সিস্টেমের বার্তা।',
  },
  {
    title: '৩. আমরা তথ্য কীভাবে ব্যবহার করি',
    body: 'পরিচয় ও ডকুমেন্ট যাচাই; শিক্ষার্থীদের উপযুক্ত প্রতিষ্ঠান ও এজেন্সির সাথে মেলানো; আবেদন প্রক্রিয়াকরণ ও লিড স্ট্যাটাস ট্র্যাকিং; প্ল্যাটফর্ম বিজ্ঞপ্তি পাঠানো; পরিষেবা উন্নয়নের জন্য বেনামী বিশ্লেষণ; আইনি বাধ্যবাধকতা পালন।',
  },
  {
    title: '৪. ডকুমেন্ট লকিং ও OCR প্রক্রিয়াকরণ',
    body: 'ডকুমেন্ট আপলোড করলে OCR সিস্টেম তথ্য বের করে যাচাই করে। অ্যাডমিন প্রোফাইল যাচাই করলে ডকুমেন্ট লক হয়ে যায় — পরিবর্তন, প্রতিস্থাপন বা মুছে ফেলা যায় না। এটি একটি মূল নিরাপত্তা বৈশিষ্ট্য।',
  },
  {
    title: '৫. কে আপনার তথ্য দেখতে পারে',
    body: 'শিক্ষার্থীদের যোগাযোগের তথ্য (ফোন, ইমেইল) কখনো প্রতিষ্ঠান বা এজেন্সিকে দেখানো হয় না। প্রতিষ্ঠানগুলো শুধু যোগ্যতা, একাডেমিক স্কোর ও ভাষা সার্টিফিকেট দেখতে পায়। নির্ধারিত এজেন্সি আবেদন প্রক্রিয়াকরণের জন্য প্রয়োজনীয় পরিসরে নাম ও মূল প্রোফাইল দেখতে পারে।',
  },
  {
    title: '৬. তৃতীয় পক্ষের সাথে তথ্য শেয়ার',
    body: 'আমরা আপনার ডেটা বিক্রি করি না। ক্লাউড হোস্টিং, ইমেইল ডেলিভারির মতো বিশ্বস্ত প্রযুক্তি অংশীদার; আইনে প্রয়োজনীয় হলে সরকারি সংস্থা; আবেদনের পরিধির মধ্যে পার্টনার প্রতিষ্ঠান ও এজেন্সির সাথে তথ্য শেয়ার করা হতে পারে।',
  },
  {
    title: '৭. ডেটা নিরাপত্তা',
    body: 'সংরক্ষিত ডেটার জন্য AES-256 এনক্রিপশন ব্যবহার করা হয়। সকল যোগাযোগ HTTPS দ্বারা সুরক্ষিত। ভূমিকাভিত্তিক অ্যাক্সেস নিয়ন্ত্রণ নিশ্চিত করে কর্মীরা শুধু তাদের কাজের জন্য প্রয়োজনীয় তথ্য দেখতে পারে।',
  },
  {
    title: '৮. ডেটা সংরক্ষণের মেয়াদ',
    body: 'অ্যাকাউন্ট সক্রিয় থাকাকালীন অ্যাকাউন্ট ডেটা রাখা হয়। অ্যাকাউন্ট মুছে ফেলার পর বেনামী ডেটা বিশ্লেষণ ও আইনি সম্মতির জন্য সর্বোচ্চ ৩ বছর রাখা হতে পারে।',
  },
  {
    title: '৯. আপনার অধিকার',
    body: 'আপনার কাছে থাকা ব্যক্তিগত ডেটা দেখার অধিকার, ভুল তথ্য সংশোধনের অনুরোধ, অ্যাকাউন্ট ও সংশ্লিষ্ট ডেটা মুছে ফেলার অনুরোধ, এবং অ-প্রয়োজনীয় ডেটা প্রক্রিয়াকরণের সম্মতি প্রত্যাহারের অধিকার আপনার রয়েছে। এই অধিকার প্রয়োগ করতে support@tensai.com-এ যোগাযোগ করুন।',
  },
  {
    title: '১০. কুকি ও ট্র্যাকিং',
    body: 'সেশন বজায় রাখতে এবং ভাষার পছন্দ মনে রাখতে কুকি ব্যবহার করা হয়। তৃতীয় পক্ষের বিজ্ঞাপন কুকি ব্যবহার করা হয় না।',
  },
  {
    title: '১১. শিশুদের প্রাইভেসি',
    body: 'টেনসাই অভিভাবকের সম্মতি ছাড়া ১৮ বছরের কম বয়সীদের জন্য নয়। কোনো অপ্রাপ্তবয়স্কের তথ্য সম্পর্কে জানতে পারলে অবিলম্বে তা মুছে ফেলা হবে।',
  },
  {
    title: '১২. নীতির পরিবর্তন',
    body: 'আমরা সময়ে সময়ে এই প্রাইভেসি নীতি আপডেট করতে পারি। গুরুত্বপূর্ণ পরিবর্তনের জন্য ইমেইল বা প্ল্যাটফর্ম বিজ্ঞপ্তির মাধ্যমে জানানো হবে।',
  },
  {
    title: '১৩. যোগাযোগ',
    body: 'এই প্রাইভেসি নীতি সম্পর্কে প্রশ্ন থাকলে: support@tensai.com',
  },
];

const HIGHLIGHTS = [
  { icon: '🔒', label: 'AES-256 Encrypted', labelJa: 'AES-256暗号化', labelBn: 'AES-256 এনক্রিপ্টেড' },
  { icon: '🚫', label: 'Never Sold', labelJa: '販売なし', labelBn: 'বিক্রি হয় না' },
  { icon: '👁️', label: 'Contact Info Masked', labelJa: '連絡先非表示', labelBn: 'যোগাযোগ তথ্য গোপন' },
  { icon: '📋', label: 'Full Audit Trail', labelJa: '完全監査証跡', labelBn: 'সম্পূর্ণ অডিট ট্রেইল' },
];

export default function PrivacyPage() {
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
      <section className="relative overflow-hidden px-4 pt-32 pb-10 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-cyan-600/7 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            {'🛡️'} {ja ? 'プライバシーポリシー' : bn ? 'প্রাইভেসি নীতি' : 'Privacy Policy'}
          </div>
          <h1 className="text-fluid-4xl font-black text-white tracking-tight mb-3 leading-tight">
            {ja ? 'プライバシーポリシー' : bn ? 'প্রাইভেসি নীতি' : 'Privacy Policy'}
          </h1>
          <p className="text-white/35 text-xs">
            {ja ? '最終更新：2026年1月' : bn ? 'সর্বশেষ আপডেট: জানুয়ারি ২০২৬' : 'Last updated: January 2026'}
          </p>
        </div>
      </section>

      {/* ── Highlights Strip ───────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="glass-card rounded-2xl py-4 px-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {HIGHLIGHTS.map((h) => (
            <div key={h.label} className="flex flex-col items-center gap-1.5">
              <span className="text-xl">{h.icon}</span>
              <span className="text-[11px] font-semibold text-white/55">{ja ? h.labelJa : bn ? h.labelBn : h.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pb-16">

        {/* Intro callout */}
        <div className="glass-card rounded-2xl p-5 mb-8 border-l-4 border-cyan-500/50">
          <p className="text-white/55 text-sm leading-relaxed">
            {ja
              ? 'あなたのプライバシーは私たちにとって重要です。Tensaiはプラットフォームの信頼性の基盤として、データ保護を設計の中心に置いています。'
              : bn
              ? 'আপনার প্রাইভেসি আমাদের কাছে গুরুত্বপূর্ণ। টেনসাই প্ল্যাটফর্মের বিশ্বাসযোগ্যতার ভিত্তি হিসেবে ডেটা সুরক্ষাকে ডিজাইনের কেন্দ্রে রেখেছে।'
              : "Your privacy matters to us. Tensai is built on trust — data protection is not an afterthought, it's central to how the platform works."}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((s, i) => (
            <div key={s.title} className="glass-card rounded-2xl p-6 card-hover-glow transition-all">
              <div className="flex items-start gap-4">
                <span className="shrink-0 w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black flex items-center justify-center mt-0.5">
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
          <Link href="/terms" className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all glow-green">
            {ja ? '利用規約を読む →' : bn ? 'শর্তাবলী পড়ুন →' : 'Read Terms & Conditions →'}
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
            <Link href="/terms"   className="hover:text-white/60 transition-colors">{termsText}</Link>
            <Link href="/privacy" className="text-cyan-400 font-medium">{privText}</Link>
          </div>
          <p className="text-xs text-white/30">{l.footer}</p>
        </div>
      </footer>

    </div>
  );
}
