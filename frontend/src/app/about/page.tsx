'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  const { t, lang, toggle } = useLang();
  const l = t.landing;
  const a = t.about;

  const STATS = [
    { value: '4',       label: a.stat1 },
    { value: '100%',    label: a.stat2 },
    { value: '0',       label: a.stat3 },
    { value: 'BD→JP',  label: a.stat4 },
  ];

  const PILLARS = [
    { icon: '🔒', title: a.p1Title, desc: a.p1Desc },
    { icon: '🤖', title: a.p2Title, desc: a.p2Desc },
    { icon: '🤝', title: a.p3Title, desc: a.p3Desc },
    { icon: '🛡️', title: a.p4Title, desc: a.p4Desc },
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
      avatarBg: 'bg-green-700',
      badgeColor: 'bg-green-100 text-green-800',
      cardBorder: 'border-green-200 hover:border-green-300',
      linkedin: 'https://linkedin.com/in/md-norozzaman-207418169/',
      photo: 'https://pub-f01f8a3511524b808cb8116aa5d495aa.r2.dev/ceo.webp',
    },
    {
      name: 'Nasir Sarker',
      initials: 'NS',
      role: a.role2,
      bio: a.bio2,
      badge: a.badge2,
      avatarBg: 'bg-slate-700',
      badgeColor: 'bg-slate-100 text-slate-700',
      cardBorder: 'border-slate-200 hover:border-slate-300',
      linkedin: null,
      photo: null,
    },
    {
      name: 'Sabbir',
      initials: 'SB',
      role: a.role3,
      bio: a.bio3,
      badge: a.badge3,
      avatarBg: 'bg-blue-700',
      badgeColor: 'bg-blue-100 text-blue-800',
      cardBorder: 'border-blue-200 hover:border-blue-300',
      linkedin: null,
      photo: 'https://pub-f01f8a3511524b808cb8116aa5d495aa.r2.dev/WhatsApp%20Image%202026-06-06%20at%209.06.32%20PM.jpeg',
    },
  ];

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
            <Link href="/about" className="text-sm font-semibold text-green-700 border-b-2 border-green-600 px-2 py-1 hidden sm:inline">
              {a.navAbout}
            </Link>
            <Link href="/team" className="text-sm text-slate-600 hover:text-green-800 transition-colors px-2 py-1 hidden sm:inline">
              {a.navTeam}
            </Link>
            <Link href="/gallery" className="text-sm text-slate-600 hover:text-green-800 transition-colors px-2 py-1 hidden sm:inline">
              {a.navGallery}
            </Link>
            <Link href="/auth/login" className="text-sm text-slate-600 hover:text-green-800 transition-colors px-2 py-1">
              {l.login}
            </Link>
            <Link href="/auth/register" className="text-sm bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-full font-medium transition-colors">
              {l.getStarted}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-16 sm:pt-24 pb-14 sm:pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          {a.badge}
        </div>
        <h1 className="text-fluid-hero font-bold text-slate-900 leading-tight mb-6">
          {a.heroTitle}<br />
          <span className="text-green-700">{a.heroHighlight}</span>
        </h1>
        <p className="text-fluid-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-8">
          {a.heroDesc}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/auth/register" className="bg-green-700 hover:bg-green-800 text-white px-7 py-3 rounded-full font-semibold text-sm transition-colors">
            {a.ctaStart}
          </Link>
          <Link href="#how" className="border border-slate-200 hover:border-green-300 text-slate-700 hover:text-green-800 px-7 py-3 rounded-full font-semibold text-sm transition-colors">
            {a.ctaSeeHow}
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-green-700 py-10 sm:py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-white">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-3xl sm:text-4xl font-bold mb-1">{s.value}</div>
                <div className="text-green-200 text-xs sm:text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-3xl mx-auto px-4 py-14 sm:py-20">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            {a.storyBadge}
          </div>
          <h2 className="text-fluid-4xl font-bold text-slate-900">{a.storyTitle}</h2>
        </div>
        <div className="space-y-5 text-slate-600 text-fluid-lg leading-relaxed">
          <p>{a.story1}</p>
          <p>{a.story2}</p>
          <p>{a.story3}</p>
        </div>
      </section>

      {/* What We Stand For */}
      <section className="bg-slate-50 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-fluid-4xl font-bold text-slate-900">{a.pillarsTitle}</h2>
            <p className="text-slate-500 text-sm mt-2">{a.pillarsSub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((p) => (
              <div key={p.title} className="bg-white flex flex-col items-start gap-3 p-6 rounded-2xl border border-slate-100 hover:border-green-200 hover:shadow-sm transition-all">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">{p.icon}</div>
                <h3 className="font-bold text-slate-900">{p.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="max-w-7xl mx-auto px-4 py-14 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-fluid-4xl font-bold text-slate-900">{a.howTitle}</h2>
          <p className="text-slate-500 text-sm mt-2">{a.howSub}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {HOW.map((h, i) => (
            <div key={h.step} className="relative bg-white border border-slate-100 rounded-2xl p-6 hover:border-green-200 hover:shadow-md transition-all">
              {i < HOW.length - 1 && (
                <div className="hidden lg:block absolute top-8 -right-3 w-6 h-px bg-slate-200 z-10" />
              )}
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-green-700 text-white text-xs font-bold shrink-0">{h.step}</span>
                <span className="text-2xl">{h.icon}</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{h.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="bg-slate-50 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-fluid-4xl font-bold text-slate-900">{a.teamTitle}</h2>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">{a.teamSub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TEAM.map((member) => (
              <div key={member.name} className={`bg-white border rounded-2xl p-7 flex flex-col gap-4 hover:shadow-md transition-all ${member.cardBorder}`}>
                <div className="flex items-center gap-4">
                  {member.photo ? (
                    <Image
                      src={member.photo}
                      alt={member.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full ${member.avatarBg} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {member.initials}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-900 text-sm leading-tight">{member.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-snug">{member.role}</div>
                  </div>
                </div>
                <span className={`self-start text-[11px] font-semibold px-2.5 py-1 rounded-full ${member.badgeColor}`}>
                  {member.badge}
                </span>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">{member.bio}</p>
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="self-start text-xs text-green-700 font-semibold hover:underline">
                    LinkedIn →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-14 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="text-4xl mb-5">🚀</div>
          <h2 className="text-fluid-4xl font-bold text-white mb-4">
            {lang === 'ja' ? 'グローバルキャリアへの道を、今。' : lang === 'bn' ? 'আপনার বৈশ্বিক ক্যারিয়ার শুরু হোক এখানে।' : 'Your global career starts here.'}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mb-8 leading-relaxed">
            {lang === 'ja' ? '学生・エージェンシー・教育機関・アフィリエイト — 天才はあなたのために作られています。' : lang === 'bn' ? 'শিক্ষার্থী, এজেন্সি, বিশ্ববিদ্যালয় বা অ্যাফিলিয়েট — টেনসাই আপনার জন্যই তৈরি।' : 'Student, agency, university, or affiliate — Tensai was built for you. Join the ecosystem that puts trust first.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/register" className="bg-green-700 hover:bg-green-800 text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-colors">
              {a.ctaStart}
            </Link>
            <Link href="/" className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-colors">
              {lang === 'ja' ? '← ホームに戻る' : lang === 'bn' ? '← হোমে ফিরুন' : '← Back to Home'}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 sm:py-8 text-center text-sm text-slate-400">
        <div className="mb-3 flex items-center justify-center gap-4">
          <Link href="/about" className="text-green-700 font-medium">{a.navAbout}</Link>
          <Link href="/terms" className="hover:text-green-700 transition-colors">{lang === 'ja' ? '利用規約' : lang === 'bn' ? 'শর্তাবলী' : 'Terms'}</Link>
          <Link href="/privacy" className="hover:text-green-700 transition-colors">{lang === 'ja' ? 'プライバシー' : lang === 'bn' ? 'প্রাইভেসি' : 'Privacy'}</Link>
        </div>
        {l.footer}
      </footer>
    </div>
  );
}
