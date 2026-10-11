'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import FooterSocialLinks from '@/components/shared/FooterSocialLinks';
import SiteHeader from '@/components/shared/SiteHeader';

export default function MobilityClient() {
  const { t, lang } = useLang();
  const l = t.landing;
  const a = t.about;
  const ja = lang === 'ja';
  const bn = lang === 'bn';
  const tr = (en: string, ja_: string, bn_: string) => (ja ? ja_ : bn ? bn_ : en);

  const termsText = tr('Terms', '利用規約', 'শর্তাবলী');
  const privText = tr('Privacy', 'プライバシー', 'প্রাইভেসি');

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <SiteHeader active="mobility" />

      <section className="relative overflow-hidden min-h-[60vh] flex items-center justify-center px-4 pt-24 pb-16 text-center bg-[#0d1117]">
        <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-green-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] bg-cyan-500/7 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-7 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
            {tr('Coming soon', '近日公開', 'শীঘ্রই আসছে')}
          </div>
          <h1 className="text-fluid-hero font-black text-white mb-5 leading-[1.06] tracking-tight">
            <span className="gradient-text">
              {tr('Skilled Worker Mobility', 'Skilled Worker Mobility', 'দক্ষ কর্মী মোবিলিটি')}
            </span>
          </h1>
          <p className="text-fluid-lg text-white/45 max-w-xl mx-auto leading-relaxed">
            {tr(
              'Consultancy support for skilled workers: a verified profile with a short skill video, and guidance towards overseas opportunities.',
              '技能労働者向けのコンサルティング支援：短いスキル動画付きの検証済みプロフィールと、海外の機会に向けたガイダンス。',
              'দক্ষ কর্মীদের জন্য পরামর্শ সহায়তা: ছোট স্কিল ভিডিওসহ যাচাইকৃত প্রোফাইল এবং বিদেশের সুযোগ সম্পর্কে দিকনির্দেশনা।'
            )}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0d1117] to-transparent pointer-events-none" />
      </section>

      <footer className="border-t border-white/[0.06] py-8 px-4 bg-alt-section">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] text-white/20 text-center leading-relaxed mb-5 italic max-w-2xl mx-auto">
            {tr(
              'Tensai is a consultancy and technology platform. We do not guarantee jobs or visas. Employment and visa processing are handled by licensed partner agencies.',
              '天才はコンサルティングおよびテクノロジープラットフォームです。就職やビザは保証しません。就労・ビザ手続きは認可を受けたパートナー機関が行います。',
              'টেনসাই একটি পরামর্শ ও প্রযুক্তি প্ল্যাটফর্ম। আমরা চাকরি বা ভিসার নিশ্চয়তা দিই না। চাকরি ও ভিসা প্রক্রিয়া লাইসেন্সপ্রাপ্ত পার্টনার এজেন্সি সম্পন্ন করে।'
            )}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/tensai-logo.png" alt="Tensai" width={28} height={28} className="rounded-full object-contain" />
              <span className="text-sm font-bold text-white/75">Tensai</span>
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/38">
              <Link href="/about" className="hover:text-white/65 transition-colors">{a.navAbout}</Link>
              <Link href="/team" className="hover:text-white/65 transition-colors">{a.navTeam}</Link>
              <Link href="/gallery" className="hover:text-white/65 transition-colors">{a.navGallery}</Link>
              <Link href="/terms" className="hover:text-white/65 transition-colors">{termsText}</Link>
              <Link href="/privacy" className="hover:text-white/65 transition-colors">{privText}</Link>
            </div>
            <div className="flex flex-col items-center sm:items-end gap-2">
              <FooterSocialLinks />
              <p className="text-xs text-white/30">{l.footer}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
