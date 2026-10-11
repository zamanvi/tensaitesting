'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import FooterSocialLinks from '@/components/shared/FooterSocialLinks';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import SiteHeader from '@/components/shared/SiteHeader';

interface SiteSettings {
  support_whatsapp?: string;
  support_phone?: string;
  support_email?: string;
  office_address?: string;
}

interface BranchSummary {
  id: number;
  name: string;
  slug: string;
  city: string;
}

const DEFAULT_WHATSAPP = '8801961770211';
const DEFAULT_PHONE = '+880 1961-770211';
const DEFAULT_EMAIL = 'hello@tensaiconsultancy.com';

const PHONE_SVG = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);
const WHATSAPP_SVG = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12.004 2c-5.514 0-9.997 4.484-9.997 9.997 0 1.762.462 3.484 1.34 5.003L2 22l5.144-1.35a9.96 9.96 0 004.86 1.238h.004c5.513 0 9.996-4.484 9.996-9.997C21.996 6.49 17.518 2 12.004 2zm0 18.294a8.276 8.276 0 01-4.223-1.156l-.303-.18-3.055.802.816-2.98-.198-.306a8.284 8.284 0 01-1.276-4.42c0-4.588 3.735-8.322 8.243-8.322 2.203 0 4.273.858 5.83 2.417a8.196 8.196 0 012.412 5.828c0 4.588-3.735 8.317-8.246 8.317z" />
  </svg>
);
const EMAIL_SVG = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const PIN_SVG = (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function ContactPage() {
  const { t, lang } = useLang();
  const l = t.landing;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ['public-settings'],
    queryFn: () => api.get('/settings/public').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: branches = [] } = useQuery<BranchSummary[]>({
    queryKey: ['public-branches-summary'],
    queryFn: () => api.get('/branches').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const phone = settings?.support_phone || DEFAULT_PHONE;
  const whatsappNumber = settings?.support_whatsapp || DEFAULT_WHATSAPP;
  const whatsappHref = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;
  const email = settings?.support_email || DEFAULT_EMAIL;

  const navAbout = ja ? '会社概要' : bn ? 'আমাদের সম্পর্কে' : 'About';
  const navTeam  = ja ? 'チーム' : bn ? 'টিম' : 'Team';
  const termsText = l.terms;
  const privText  = l.privacy;

  const pageTitle = ja ? 'お問い合わせ' : bn ? 'যোগাযোগ করুন' : 'Contact Us';
  const pageDesc = ja
    ? 'ご質問、ご相談、パートナーシップのお問い合わせはこちらから。私たちのチームが直接対応します。'
    : bn ? 'প্রশ্ন, পরামর্শ বা পার্টনারশিপ সংক্রান্ত যেকোনো বিষয়ে সরাসরি আমাদের সাথে যোগাযোগ করুন।'
    : 'Questions, partnership inquiries, or anything else — reach us directly and our team will respond.';

  return (
    <div className="min-h-screen bg-[#0d1117]">

      <SiteHeader active="contact" />

      <main>

        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="hero-mesh relative overflow-hidden pt-32 pb-16 px-4 text-center">
          <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-green-600/10 rounded-full blur-[160px] pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 right-[5%] w-[350px] h-[350px] bg-cyan-500/7 rounded-full blur-[130px] pointer-events-none" aria-hidden="true" />
          <div className="relative z-10 max-w-2xl mx-auto animate-fade-up">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" aria-hidden="true" />
              {ja ? 'いつでもご連絡ください' : bn ? 'আমরা সবসময় পাশে আছি' : "We're here to help"}
            </div>
            <h1 className="text-fluid-hero font-black text-white leading-[1.06] tracking-tight mb-5">
              {pageTitle}
            </h1>
            <p className="text-fluid-base text-white/50 max-w-xl mx-auto leading-relaxed">
              {pageDesc}
            </p>
          </div>
        </section>

        {/* ── Contact Cards ──────────────────────────────────── */}
        <section className="py-8 sm:py-12 px-4">
          <div className="max-w-4xl mx-auto grid gap-4 sm:grid-cols-3">

            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="glass-card border border-white/[0.08] rounded-2xl p-6 flex flex-col items-center text-center gap-3 hover:border-green-500/35 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center text-white/70">{PHONE_SVG}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
                {ja ? '電話' : bn ? 'ফোন' : 'Phone'}
              </div>
              <div className="text-white font-semibold text-sm" dir="ltr">{phone}</div>
            </a>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500/10 border border-green-500/25 rounded-2xl p-6 flex flex-col items-center text-center gap-3 hover:bg-green-500/20 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center text-green-400">{WHATSAPP_SVG}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-green-400/80">WhatsApp</div>
              <div className="text-green-400 font-semibold text-sm" dir="ltr">+{whatsappNumber.replace(/[^0-9]/g, '')}</div>
            </a>

            <a
              href={`mailto:${email}`}
              className="glass-card border border-white/[0.08] rounded-2xl p-6 flex flex-col items-center text-center gap-3 hover:border-green-500/35 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center text-white/70">{EMAIL_SVG}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
                {ja ? 'メール' : bn ? 'ইমেইল' : 'Email'}
              </div>
              <div className="text-white font-semibold text-sm break-all">{email}</div>
            </a>

          </div>

          {settings?.office_address && (
            <div className="max-w-4xl mx-auto mt-4">
              <div className="glass-card border border-white/[0.08] rounded-2xl p-6 flex items-center gap-3 justify-center text-center">
                <span className="text-white/50">{PIN_SVG}</span>
                <span className="text-white/60 text-sm">{settings.office_address}</span>
              </div>
            </div>
          )}
        </section>

        {/* ── Find a branch near you ────────────────────────── */}
        {branches.length > 0 ? (
          <section className="pb-20 px-4">
            <div className="max-w-4xl mx-auto">
              <p className="text-center text-white/40 text-xs font-semibold uppercase tracking-wider mb-5">
                {ja ? 'または最寄りの支局へ' : bn ? 'অথবা সরাসরি শাখায় যোগাযোগ করুন' : 'Or reach out to a branch near you'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {branches.slice(0, 3).map(b => (
                  <Link key={b.id} href={`/branches/${b.slug}`}
                    className="glass-card border border-white/[0.08] rounded-2xl p-5 hover:border-green-500/35 transition-all group">
                    <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium mb-1.5">
                      {PIN_SVG}
                      {b.city}
                    </div>
                    <p className="text-white font-semibold text-sm group-hover:text-green-400 transition-colors">{b.name}</p>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-6">
                <Link href="/branches" className="text-green-400 text-xs hover:underline">
                  {ja ? '支局一覧をすべて見る →' : bn ? 'সব শাখা দেখুন →' : 'See all branches →'}
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <div className="max-w-4xl mx-auto mt-8 pb-20 px-4 text-center">
            <p className="text-white/35 text-xs">
              {ja
                ? 'または各支局を直接訪問することもできます。'
                : bn ? 'অথবা সরাসরি আমাদের যেকোনো শাখায় দেখা করতে পারেন।'
                : 'Or visit one of our branches in person.'}
              {' '}
              <Link href="/branches" className="text-green-400 hover:underline">
                {ja ? '支局一覧を見る →' : bn ? 'শাখাগুলো দেখুন →' : 'See branches →'}
              </Link>
            </p>
          </div>
        )}

      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-8 px-4 bg-alt-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/tensai-logo.png" alt="Tensai" width={26} height={26} className="rounded-full object-contain opacity-70" />
              <span className="text-sm font-bold text-white/50">Tensai</span>
            </Link>
            <nav aria-label={ja ? 'フッターナビゲーション' : bn ? 'ফুটার নেভিগেশন' : 'Footer navigation'}>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/35">
                <Link href="/about"   className="hover:text-white/65 transition-colors">{navAbout}</Link>
                <Link href="/team"    className="hover:text-white/65 transition-colors">{navTeam}</Link>
                <Link href="/contact" className="text-green-400 font-medium">{pageTitle}</Link>
                <Link href="/terms"   className="hover:text-white/65 transition-colors">{termsText}</Link>
                <Link href="/privacy" className="hover:text-white/65 transition-colors">{privText}</Link>
              </div>
            </nav>
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
