'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';

export default function BranchesFooter() {
  const { t, lang } = useLang();
  const l = t.landing;
  const a = t.about;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  return (
    <footer className="border-t border-white/[0.06] py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/tensai-logo.png" alt="Tensai Logo" width={28} height={28} className="rounded-full object-contain" />
          <span className="text-sm font-bold text-white/75">Tensai</span>
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/38">
          <Link href="/about"    className="hover:text-white/65 transition-colors">{a.navAbout}</Link>
          <Link href="/team"     className="hover:text-white/65 transition-colors">{a.navTeam}</Link>
          <Link href="/gallery"  className="hover:text-white/65 transition-colors">{a.navGallery}</Link>
          <Link href="/branches" className="text-green-400 font-medium">{ja ? '支局' : bn ? 'শাখা' : 'Branches'}</Link>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/30">{l.footer}</p>
          <p className="text-[10px] text-white/20 mt-0.5 max-w-sm text-right leading-relaxed">
            {ja
              ? '天才は教育・人材マーケットプレイスです。ビザ代理店でも人材派遣業者でもありません。'
              : bn
              ? 'টেনসাই একটি টেক-চালিত শিক্ষা ও প্রতিভা মার্কেটপ্লেস — ভিসা এজেন্সি বা জনশক্তি সরবরাহকারী নয়।'
              : 'Tensai is a tech-enabled Education & Talent Marketplace — not a visa agency or manpower recruiter. We train, verify, and connect.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
