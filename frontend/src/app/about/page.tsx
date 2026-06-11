'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface SiteSettings {
  support_whatsapp?: string;
  support_phone?: string;
  support_email?: string;
  office_address?: string;
}

export default function AboutPage() {
  const { t, lang, toggle } = useLang();
  const l = t.landing;
  const a = t.about;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ['public-settings'],
    queryFn: () => api.get('/settings/public').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const STATS = [
    { value: '4',      label: a.stat1 },
    { value: '100%',   label: a.stat2 },
    { value: '0',      label: a.stat3 },
    { value: 'BD→JP', label: a.stat4 },
  ];

  const PILLARS = [
    { icon: '🔒', title: a.p1Title, desc: a.p1Desc, color: 'from-green-500/15 to-green-600/5'  },
    { icon: '🤖', title: a.p2Title, desc: a.p2Desc, color: 'from-cyan-500/15 to-cyan-600/5'    },
    { icon: '🤝', title: a.p3Title, desc: a.p3Desc, color: 'from-violet-500/15 to-violet-600/5' },
    { icon: '🛡️', title: a.p4Title, desc: a.p4Desc, color: 'from-amber-500/15 to-amber-600/5'  },
  ];

  const HOW = [
    { step: '01', icon: '🎓', title: a.h1Title, desc: a.h1Desc },
    { step: '02', icon: '🏢', title: a.h2Title, desc: a.h2Desc },
    { step: '03', icon: '🏫', title: a.h3Title, desc: a.h3Desc },
    { step: '04', icon: '✈️', title: a.h4Title, desc: a.h4Desc },
  ];

  const TEAM = [
    {
      name: 'Md. Norozzaman',
      initials: 'MN',
      role: a.role1,
      bio: a.bio1,
      badge: a.badge1,
      photo: 'https://pub-f01f8a3511524b808cb8116aa5d495aa.r2.dev/ceo.webp',
      avatarBg: 'bg-green-700',
      linkedin: 'https://linkedin.com/in/md-norozzaman-207418169/',
      accent: 'border-green-200 hover:border-green-400',
      badgeColor: 'bg-green-50 text-green-700 border border-green-200',
    },
    {
      name: 'Nasir Sarker',
      initials: 'NS',
      role: a.role2,
      bio: a.bio2,
      badge: a.badge2,
      photo: null,
      avatarBg: 'bg-slate-700',
      linkedin: null,
      accent: 'border-slate-200 hover:border-slate-400',
      badgeColor: 'bg-slate-50 text-slate-600 border border-slate-200',
    },
    {
      name: 'Sabbir',
      initials: 'SB',
      role: a.role3,
      bio: a.bio3,
      badge: a.badge3,
      photo: 'https://pub-f01f8a3511524b808cb8116aa5d495aa.r2.dev/WhatsApp%20Image%202026-06-06%20at%209.06.32%20PM.jpeg',
      avatarBg: 'bg-blue-700',
      linkedin: null,
      accent: 'border-blue-200 hover:border-blue-400',
      badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200',
    },
  ];

  /* Use i18n keys (now available in all 3 languages) */
  const termsText = l.terms;
  const privText  = l.privacy;

  /* Lang toggle */
  const toggleLabel    = lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English';
  const toggleAriaLabel = lang === 'en'
    ? 'Switch to Bangla'
    : lang === 'bn'
    ? '日本語に切り替える'
    : 'Switch to English';

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav
        aria-label={ja ? 'メインナビゲーション' : bn ? 'প্রধান নেভিগেশন' : 'Main navigation'}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/tensai-logo.png" alt="Tensai" width={36} height={36} className="rounded-full object-contain" priority />
            <div>
              <div className="text-base font-bold text-slate-900 tracking-tight leading-none">Tensai</div>
              <div className="text-[9px] text-slate-400 tracking-wider leading-none mt-0.5 hidden sm:block">
                {ja ? 'グローバルキャリアへの道' : bn ? 'বৈশ্বিক ক্যারিয়ারের পথ' : 'THE WAY OF GLOBAL CAREER'}
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggle}
              aria-label={toggleAriaLabel}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-green-400 hover:text-green-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              {toggleLabel}
            </button>
            {/* Active page indicator */}
            <Link href="/about"    className="text-sm font-semibold text-green-700 px-2 py-1 hidden md:inline border-b-2 border-green-600">{a.navAbout}</Link>
            <Link href="/team"     className="text-sm text-slate-500 hover:text-slate-900 transition-colors px-2 py-1 hidden md:inline">{a.navTeam}</Link>
            <Link href="/gallery"  className="text-sm text-slate-500 hover:text-slate-900 transition-colors px-2 py-1 hidden md:inline">{a.navGallery}</Link>
            <Link href="/branches" className="text-sm text-slate-500 hover:text-slate-900 transition-colors px-2 py-1 hidden md:inline">{ja ? '支局' : bn ? 'শাখা' : 'Branches'}</Link>
            <Link href="/auth/login" className="text-sm text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5 hidden sm:inline">{l.login}</Link>
            <Link
              href="/auth/register"
              className="text-sm bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-full font-semibold transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 hidden sm:inline"
            >
              {l.getStarted}
            </Link>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
              aria-label="Menu"
            >
              {mobileOpen
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              }
            </button>
          </div>
        </div>
        {/* Mobile menu dropdown */}
        {mobileOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-4 flex flex-col gap-1 shadow-lg">
            <Link href="/about"    onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-green-700 px-3 py-2.5 rounded-xl bg-green-50">{a.navAbout}</Link>
            <Link href="/team"     onClick={() => setMobileOpen(false)} className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all">{a.navTeam}</Link>
            <Link href="/gallery"  onClick={() => setMobileOpen(false)} className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all">{a.navGallery}</Link>
            <Link href="/branches" onClick={() => setMobileOpen(false)} className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all">{ja ? '支局' : bn ? 'শাখা' : 'Branches'}</Link>
            <div className="border-t border-slate-100 mt-2 pt-3 flex gap-2">
              <Link href="/auth/login"    onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-full transition-all">{l.login}</Link>
              <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm bg-green-700 hover:bg-green-600 text-white px-4 py-2.5 rounded-full font-semibold transition-all">{l.getStarted}</Link>
            </div>
          </div>
        )}
      </nav>

      <main>

        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-32 pb-20 px-4 text-center">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-50/80 via-white to-white pointer-events-none" aria-hidden="true" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-green-400/8 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            aria-hidden="true"
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.8) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-700/8 border border-green-700/15 text-green-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse shrink-0" aria-hidden="true" />
              {a.badge}
            </div>
            <h1 className="text-fluid-hero font-black text-slate-900 leading-[1.06] tracking-tight mb-5">
              {a.heroTitle}<br />
              <span className="text-green-700">{a.heroHighlight}</span>
            </h1>
            <p className="text-fluid-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-8">
              {a.heroDesc}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth/register"
                className="bg-green-700 hover:bg-green-600 text-white px-8 py-3.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-green-700/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              >
                {a.ctaStart}
              </Link>
              <Link
                href="#how"
                className="border border-slate-200 hover:border-green-400 text-slate-700 hover:text-green-800 px-8 py-3.5 rounded-full font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              >
                {a.ctaSeeHow}
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats Strip ────────────────────────────────────── */}
        <section className="py-12 px-4 border-y border-slate-100 bg-slate-50/60" aria-label={ja ? '主な数値' : bn ? 'মূল পরিসংখ্যান' : 'Key statistics'}>
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Use index keys — labels change with lang */}
              {STATS.map((s, i) => (
                <div key={i} className="bg-white px-6 py-6 text-center">
                  <div className="text-fluid-4xl font-black text-green-700 leading-none mb-1">{s.value}</div>
                  <div className="text-xs text-slate-500 leading-snug mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Our Story ──────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 py-16 sm:py-20">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              {a.storyBadge}
            </div>
            <h2 className="text-fluid-4xl font-bold text-slate-900 mb-2">{a.storyTitle}</h2>
          </div>
          <div className="space-y-5 text-slate-600 text-fluid-base leading-relaxed">
            <p>{a.story1}</p>
            <p>{a.story2}</p>
            <p>{a.story3}</p>
          </div>
        </section>

        {/* ── What We Stand For ──────────────────────────────── */}
        <section className="bg-slate-50 py-16 sm:py-20 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-slate-400 text-[11px] font-semibold tracking-[0.3em] uppercase mb-2">
                {ja ? '私たちの価値観' : bn ? 'আমাদের মূলনীতি' : 'Core Principles'}
              </p>
              <h2 className="text-fluid-4xl font-bold text-slate-900">{a.pillarsTitle}</h2>
              <p className="text-slate-400 text-sm mt-2">{a.pillarsSub}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PILLARS.map((p) => (
                <div key={p.title} className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-green-200 hover:shadow-md transition-all flex flex-col gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-2xl border border-slate-100`} aria-hidden="true">
                    {p.icon}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{p.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ───────────────────────────────────── */}
        <section id="how" className="max-w-7xl mx-auto px-4 py-16 sm:py-20">
          <div className="text-center mb-12">
            <p className="text-slate-400 text-[11px] font-semibold tracking-[0.3em] uppercase mb-2">
              {ja ? 'プロセス' : bn ? 'প্রক্রিয়া' : 'Process'}
            </p>
            <h2 className="text-fluid-4xl font-bold text-slate-900">{a.howTitle}</h2>
            <p className="text-slate-400 text-sm mt-2">{a.howSub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW.map((h, i) => (
              <div key={h.step} className="relative bg-white border border-slate-100 rounded-2xl p-6 hover:border-green-300 hover:shadow-lg transition-all group">
                {/* Connector line (desktop only, decorative) */}
                {i < HOW.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-2.5 w-5 h-px bg-gradient-to-r from-green-300 to-slate-200 z-10" aria-hidden="true" />
                )}
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-green-700 text-white text-xs font-black shrink-0 shadow-md shadow-green-700/25" aria-hidden="true">
                    {h.step}
                  </span>
                  <span className="text-2xl" aria-hidden="true">{h.icon}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-2 leading-snug">{h.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Team ───────────────────────────────────────────── */}
        <section className="bg-slate-50 py-16 sm:py-20 border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-slate-400 text-[11px] font-semibold tracking-[0.3em] uppercase mb-2">
                {ja ? 'チーム' : bn ? 'আমাদের দল' : 'Our Team'}
              </p>
              <h2 className="text-fluid-4xl font-bold text-slate-900">{a.teamTitle}</h2>
              <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">{a.teamSub}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {TEAM.map((member) => (
                <div key={member.name} className={`bg-white border rounded-2xl p-7 flex flex-col gap-4 hover:shadow-lg transition-all ${member.accent}`}>
                  <div className="flex items-center gap-4">
                    {member.photo ? (
                      <Image
                        src={member.photo}
                        alt={member.name}
                        width={52}
                        height={52}
                        className="w-12 h-12 rounded-xl object-cover object-top shrink-0 shadow-sm"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-xl ${member.avatarBg} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`} aria-hidden="true">
                        {member.initials}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-900 text-sm leading-tight">{member.name}</div>
                      <div className="text-xs text-green-700 font-medium mt-0.5">{member.role}</div>
                    </div>
                  </div>
                  <span className={`self-start text-[11px] font-semibold px-2.5 py-1 rounded-full ${member.badgeColor}`}>
                    {member.badge}
                  </span>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1">{member.bio}</p>
                  <div className="flex items-center justify-between mt-auto">
                    {member.linkedin ? (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-700 font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                      >
                        LinkedIn →
                      </a>
                    ) : (
                      <Link
                        href="/team"
                        className="text-xs text-slate-400 hover:text-green-700 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                      >
                        {ja ? '詳細を見る →' : bn ? 'আরও দেখুন →' : 'Full profile →'}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/team"
                className="inline-flex items-center gap-2 border border-slate-200 hover:border-green-400 text-slate-700 hover:text-green-800 px-6 py-2.5 rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              >
                {ja ? 'チームページを見る →' : bn ? 'পুরো দল দেখুন →' : 'Meet the full team →'}
              </Link>
            </div>
          </div>
        </section>

        {/* ── Contact Info ───────────────────────────────────── */}
        {(settings?.support_phone || settings?.support_email || settings?.support_whatsapp || settings?.office_address) && (
          <section className="py-12 sm:py-16 px-4 bg-white">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {ja ? 'お問い合わせ' : bn ? 'যোগাযোগ করুন' : 'Get in Touch'}
              </h2>
              <p className="text-slate-500 text-sm mb-8">
                {ja ? 'ご質問やご相談はお気軽にどうぞ。' : bn ? 'যেকোনো প্রশ্ন বা পরামর্শের জন্য আমাদের সাথে যোগাযোগ করুন।' : 'Have questions? We\'re here to help.'}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {settings?.support_phone && (
                  <a href={`tel:${settings.support_phone}`} className="flex items-center gap-2.5 px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-700 hover:border-green-300 hover:bg-green-50 transition-all">
                    <span>📞</span><span>{settings.support_phone}</span>
                  </a>
                )}
                {settings?.support_whatsapp && (
                  <a href={`https://wa.me/${settings.support_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-5 py-3 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-700 hover:bg-green-100 transition-all">
                    <span>💬</span><span>WhatsApp</span>
                  </a>
                )}
                {settings?.support_email && (
                  <a href={`mailto:${settings.support_email}`} className="flex items-center gap-2.5 px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-700 hover:border-green-300 hover:bg-green-50 transition-all">
                    <span>✉️</span><span>{settings.support_email}</span>
                  </a>
                )}
                {settings?.office_address && (
                  <div className="flex items-center gap-2.5 px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-700">
                    <span>📍</span><span>{settings.office_address}</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ────────────────────────────────────────────── */}
        <section className="bg-slate-900 py-16 sm:py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 via-transparent to-slate-900 pointer-events-none" aria-hidden="true" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-green-600/10 rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <div className="text-4xl mb-5" aria-hidden="true">{'🚀'}</div>
            <h2 className="text-fluid-4xl font-bold text-white mb-4">
              {ja ? 'グローバルキャリアへの道を、今。' : bn ? 'আপনার বৈশ্বিক ক্যারিয়ার শুরু হোক এখানে।' : 'Your global career starts here.'}
            </h2>
            <p className="text-slate-400 text-fluid-base mb-8 leading-relaxed max-w-lg mx-auto">
              {ja ? '学生・エージェンシー・教育機関・アフィリエイト — 天才はあなたのために作られています。' : bn ? 'শিক্ষার্থী, এজেন্সি, বিশ্ববিদ্যালয় বা অ্যাফিলিয়েট — টেনসাই আপনার জন্যই তৈরি।' : 'Student, agency, university, or affiliate — Tensai was built for you. Join the ecosystem that puts trust first.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth/register"
                className="bg-green-600 hover:bg-green-500 text-white px-8 py-3.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-green-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
              >
                {a.ctaStart}
              </Link>
              <Link
                href="/"
                className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              >
                {ja ? '← ホームに戻る' : bn ? '← হোমে ফিরুন' : '← Back to Home'}
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/tensai-logo.png" alt="Tensai" width={26} height={26} className="rounded-full object-contain opacity-70" />
            <span className="text-sm font-bold text-slate-500">Tensai</span>
          </Link>
          <nav aria-label={ja ? 'フッターナビゲーション' : bn ? 'ফুটার নেভিগেশন' : 'Footer navigation'}>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
              <Link href="/about"   className="text-green-700 font-medium">{a.navAbout}</Link>
              <Link href="/team"    className="hover:text-slate-700 transition-colors">{a.navTeam}</Link>
              <Link href="/gallery" className="hover:text-slate-700 transition-colors">{a.navGallery}</Link>
              <Link href="/terms"   className="hover:text-slate-700 transition-colors">{termsText}</Link>
              <Link href="/privacy" className="hover:text-slate-700 transition-colors">{privText}</Link>
            </div>
          </nav>
          <p className="text-xs text-slate-400">{l.footer}</p>
        </div>
      </footer>

    </div>
  );
}
