'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';

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
    body: '保存データにはAES-256暗号化を使用。通信はHTTPS で保護。役割ベースのアクセス制御により、スタッフは業務に必要なデータのみにアクセスできます。定期的なセキュリティ監査を実施しています。',
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

const HIGHLIGHTS = [
  { icon: '🔒', label: 'AES-256 Encrypted', labelJa: 'AES-256暗号化' },
  { icon: '🚫', label: 'Never Sold', labelJa: '販売なし' },
  { icon: '👁️', label: 'Contact Info Masked', labelJa: '連絡先非表示' },
  { icon: '📋', label: 'Full Audit Trail', labelJa: '完全監査証跡' },
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
              {lang === 'en' ? '日本語' : 'English'}
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
            🛡️ {ja ? 'プライバシーポリシー' : 'Privacy Policy'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {ja ? 'プライバシーポリシー' : 'Privacy Policy'}
          </h1>
          <p className="text-green-200 text-sm">
            {ja ? '最終更新：2026年1月' : 'Last updated: January 2026'}
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
            ? 'あなたのプライバシーは私たちにとって重要です。Tensaiはプラットフォームの信頼性の基盤として、データ保護を設計の中心に置いています。'
            : "Your privacy matters to us. Tensai is built on trust — data protection is not an afterthought, it's central to how the platform works."}
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
            ← {ja ? 'ホームに戻る' : 'Back to Home'}
          </Link>
          <Link href="/terms" className="inline-flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors">
            {ja ? '利用規約を読む →' : 'Read Terms & Conditions →'}
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
