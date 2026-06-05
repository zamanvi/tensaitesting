'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';

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
    body: 'Leads added by an agency to their Private Vault remain exclusively owned by that agency. Leads shared to the Open Pool are subject to Tensai\'s lead-sharing policy. Tensai reserves the right to moderate and remove leads that violate platform rules. Inter-agency lead transfers are final once accepted.',
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
      <div className="bg-slate-900 text-white py-12 sm:py-16 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            📄 {ja ? '利用規約' : 'Terms & Conditions'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {ja ? '利用規約' : 'Terms & Conditions'}
          </h1>
          <p className="text-slate-400 text-sm">
            {ja ? '最終更新：2026年1月' : 'Last updated: January 2026'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <p className="text-slate-500 text-sm mb-10 leading-relaxed border-l-4 border-green-600 pl-4">
          {ja
            ? 'Tensai Language & Study Consultancy（以下「Tensai」）が提供するプラットフォームをご利用いただく前に、以下の利用規約をよくお読みください。'
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
            ← {ja ? 'ホームに戻る' : 'Back to Home'}
          </Link>
          <Link href="/privacy" className="inline-flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors">
            {ja ? 'プライバシーポリシーを読む →' : 'Read Privacy Policy →'}
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
