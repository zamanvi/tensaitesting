'use client';
import { useLang } from '@/context/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://tensai-production-3af6.up.railway.app/api';

interface TeamMember {
  id: number; name: string; role: string | null; bio: string | null;
  photo_url: string | null; email: string | null; phone: string | null;
}
interface GalleryItem { id: number; display_image_url: string; caption: string | null; }
interface Service { id: number; title: string; description: string | null; icon: string | null; }
interface Branch {
  id: number; name: string; slug: string; tagline: string | null;
  description: string | null; city: string; country: string;
  address: string | null; phone: string | null; email: string | null;
  whatsapp: string | null; google_maps_url: string | null;
  logo_url: string | null; cover_image_url: string | null;
  working_hours: Record<string, string> | null;
  social_links: Record<string, string> | null;
  stats: Record<string, string> | null;
  team: TeamMember[]; gallery: GalleryItem[]; services: Service[];
}

export default function BranchPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang, toggle } = useLang();
  const l = t.landing;
  const a = t.about;
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeGalleryId, setActiveGalleryId] = useState<number | null>(null);

  const activeGalleryItem = branch?.gallery.find(g => g.id === activeGalleryId) ?? null;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/branches/${slug}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setBranch(d))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Escape key closes lightbox
  useEffect(() => {
    if (!activeGalleryId) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveGalleryId(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeGalleryId]);

  if (loading) return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" role="status" aria-label={ja ? '読み込み中' : bn ? 'লোড হচ্ছে' : 'Loading'} />
    </div>
  );

  if (notFound || !branch) return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <h1 className="text-white font-bold text-xl mb-2">{ja ? '支局が見つかりません' : bn ? 'শাখা পাওয়া যায়নি' : 'Branch not found'}</h1>
      <p className="text-white/40 text-sm mb-6">{ja ? 'このURLは存在しないか、削除された可能性があります。' : bn ? 'এই URL টি বিদ্যমান নেই বা মুছে ফেলা হয়েছে।' : 'This URL does not exist or has been removed.'}</p>
      <Link href="/branches" className="inline-flex items-center gap-2 text-green-400 text-sm border border-green-500/30 px-4 py-2 rounded-full hover:bg-green-500/10 transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
        {ja ? '支局一覧へ' : bn ? 'শাখার তালিকায়' : 'Back to Branches'}
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0d1117]/95 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/tensai-logo.png" alt="Tensai Logo" width={32} height={32} className="rounded-full object-contain" />
            <span className="text-sm font-bold text-white">Tensai</span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={toggle} aria-label="Toggle language" className="text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10 text-white/60 hover:border-green-500/40 hover:text-green-400 transition-all">
              {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
            </button>
            <Link href="/branches" className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white px-2 sm:px-3 py-1.5 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
              <span className="truncate max-w-[100px] sm:max-w-none">{ja ? '支局一覧' : bn ? 'সব শাখা' : 'All Branches'}</span>
            </Link>
            <Link href="/auth/register" className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-full font-semibold transition-all">
              {ja ? '始める' : bn ? 'শুরু করুন' : 'Get Started'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] flex items-end overflow-hidden">
        {branch.cover_image_url ? (
          <Image
            src={branch.cover_image_url}
            alt={branch.name}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 to-[#0d1117]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/70 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 pb-12 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {branch.logo_url && (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 shrink-0">
                <Image src={branch.logo_url} alt={`${branch.name} logo`} fill className="object-cover" sizes="64px" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 text-green-400 text-xs font-semibold mb-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {branch.city}, {branch.country}
              </div>
              <h1 className="text-fluid-hero font-black text-white leading-[1.06]">{branch.name}</h1>
              {branch.tagline && <p className="text-white/60 mt-2 text-sm sm:text-base">{branch.tagline}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {branch.stats && Object.keys(branch.stats).length > 0 && (
        <section className="border-y border-white/[0.06] bg-white/[0.04]">
          <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(branch.stats).map(([key, val]) => (
              <div key={key} className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-green-400">{val}</div>
                <div className="text-white/40 text-xs mt-1">{key}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-20 flex-1">

        {/* About */}
        {branch.description && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4">
              {ja ? '私たちについて' : bn ? 'আমাদের সম্পর্কে' : 'About This Branch'}
            </h2>
            <p className="text-white/55 leading-relaxed max-w-3xl">{branch.description}</p>
          </section>
        )}

        {/* Services */}
        {branch.services.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-6">
              {ja ? 'サービス内容' : bn ? 'আমাদের সেবাসমূহ' : 'Our Services'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {branch.services.map(s => (
                <div key={s.id} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-green-500/20 transition-all">
                  {s.icon && <div className="text-3xl mb-3" role="img" aria-label={s.title}>{s.icon}</div>}
                  <h3 className="font-bold text-white text-sm mb-2">{s.title}</h3>
                  {s.description && <p className="text-white/55 text-xs leading-relaxed">{s.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Team */}
        {branch.team.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-6">
              {ja ? 'チームメンバー' : bn ? 'আমাদের টিম' : 'Our Team'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {branch.team.map(m => (
                <div key={m.id} className="text-center">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 border-2 border-white/10 bg-white/[0.04]">
                    {m.photo_url ? (
                      <Image src={m.photo_url} alt={m.name} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-white text-sm">{m.name}</p>
                  {m.role && <p className="text-green-400 text-xs mt-0.5">{m.role}</p>}
                  {m.bio && <p className="text-white/50 text-xs mt-1 leading-snug line-clamp-2">{m.bio}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {branch.gallery.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-6">
              {ja ? 'ギャラリー' : bn ? 'গ্যালারি' : 'Gallery'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {branch.gallery.map(g => (
                <button
                  key={g.id}
                  className="aspect-square rounded-xl overflow-hidden cursor-pointer group border border-white/[0.06] hover:border-green-500/30 transition-all relative"
                  onClick={() => setActiveGalleryId(g.id)}
                  aria-label={g.caption ?? `${ja ? 'ギャラリー画像を拡大' : bn ? 'ছবি বড় করুন' : 'View gallery image'}`}
                >
                  <Image
                    src={g.display_image_url}
                    alt={g.caption || `${branch.name} gallery`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Contact & Working Hours */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Contact */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
            <h2 className="text-lg font-bold text-white mb-5">
              {ja ? '連絡先' : bn ? 'যোগাযোগ' : 'Contact Us'}
            </h2>
            <div className="space-y-3 text-sm">
              {branch.address && (
                <div className="flex gap-3 text-white/60">
                  <svg className="w-4 h-4 shrink-0 mt-0.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>{branch.address}</span>
                </div>
              )}
              {branch.phone && (
                <a href={`tel:${branch.phone.replace(/[^\d+]/g, '')}`} className="flex gap-3 text-white/60 hover:text-green-400 transition-colors">
                  <svg className="w-4 h-4 shrink-0 mt-0.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{branch.phone}</span>
                </a>
              )}
              {branch.email && (
                <a href={`mailto:${branch.email}`} className="flex gap-3 text-white/60 hover:text-green-400 transition-colors">
                  <svg className="w-4 h-4 shrink-0 mt-0.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{branch.email}</span>
                </a>
              )}
              {branch.whatsapp && (
                <a href={`https://wa.me/${branch.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex gap-3 text-white/60 hover:text-green-400 transition-colors">
                  <svg className="w-4 h-4 shrink-0 mt-0.5 text-white/30" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>WhatsApp: {branch.whatsapp}</span>
                </a>
              )}
              {branch.google_maps_url && (
                <a href={branch.google_maps_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-green-600/20 border border-green-500/30 text-green-400 text-xs font-semibold rounded-xl hover:bg-green-600/30 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  {ja ? 'Google マップで見る' : bn ? 'গুগল ম্যাপে দেখুন' : 'View on Google Maps'}
                </a>
              )}
            </div>

            {/* Social Links */}
            {branch.social_links && Object.keys(branch.social_links).length > 0 && (
              <div className="mt-5 pt-5 border-t border-white/[0.06]">
                <p className="text-white/40 text-xs mb-3">{ja ? 'SNS' : bn ? 'সোশ্যাল মিডিয়া' : 'Social Media'}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(branch.social_links).map(([platform, url]) => (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white/[0.05] border border-white/[0.08] text-white/60 text-xs rounded-lg hover:text-green-400 hover:border-green-500/30 transition-all capitalize">
                      {platform}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Working Hours */}
          {branch.working_hours && Object.keys(branch.working_hours).length > 0 && (
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <h2 className="text-lg font-bold text-white mb-5">
                {ja ? '営業時間' : bn ? 'অফিস সময়' : 'Working Hours'}
              </h2>
              <div className="space-y-2">
                {Object.entries(branch.working_hours).map(([day, hours]) => {
                  const isClosed = hours.toLowerCase().includes('closed') ||
                    hours.toLowerCase().includes('বন্ধ') ||
                    hours.toLowerCase().includes('休業') ||
                    hours.toLowerCase().includes('休み');
                  return (
                    <div key={day} className="flex justify-between items-center py-2 border-b border-white/[0.05] last:border-0">
                      <span className="text-white/60 text-sm">{day}</span>
                      <span className={`text-sm font-medium ${isClosed ? 'text-red-400' : 'text-green-400'}`}>
                        {hours}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="text-center py-12 rounded-2xl bg-gradient-to-br from-green-900/40 to-green-900/10 border border-green-500/25">
          <h2 className="text-2xl font-bold text-white mb-3">
            {ja ? 'まずは無料相談から' : bn ? 'আজই শুরু করুন' : 'Start Your Journey Today'}
          </h2>
          <p className="text-white/50 text-sm mb-8 max-w-md mx-auto leading-relaxed">
            {ja ? `${branch.name}のチームがあなたの留学の夢を実現するお手伝いをします。`
              : bn ? `${branch.name} এর টিম আপনার বিদেশে পড়াশোনার স্বপ্ন পূরণে সাহায্য করতে প্রস্তুত।`
              : `The ${branch.name} team is ready to help you take your first step toward studying abroad.`}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/auth/register" className="px-7 py-3 bg-green-600 hover:bg-green-500 text-white rounded-full text-sm font-bold transition-all">
              {ja ? '無料登録' : bn ? 'বিনামূল্যে রেজিস্ট্রেশন' : 'Register Free'}
            </Link>
            {branch.whatsapp && (
              <a href={`https://wa.me/${branch.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.06] border border-white/[0.15] text-white rounded-full text-sm font-semibold hover:bg-white/[0.1] transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            )}
          </div>
        </section>

      </div>

      {/* Footer */}
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
            <Link href="/branches" className="hover:text-white/65 transition-colors">{ja ? '支局' : bn ? 'শাখা' : 'Branches'}</Link>
          </div>
          <p className="text-xs text-white/30">{l.footer}</p>
        </div>
      </footer>

      {/* Gallery Lightbox */}
      {activeGalleryItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setActiveGalleryId(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeGalleryItem.caption ?? `${branch.name} gallery`}
        >
          <div className="relative max-w-5xl max-h-full w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <Image
              src={activeGalleryItem.display_image_url}
              alt={activeGalleryItem.caption || `${branch.name} gallery image`}
              width={1200}
              height={800}
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
            {activeGalleryItem.caption && (
              <p className="absolute bottom-0 left-0 right-0 text-center text-sm text-white/70 bg-black/50 py-2 rounded-b-xl">{activeGalleryItem.caption}</p>
            )}
          </div>
          <button
            onClick={() => setActiveGalleryId(null)}
            aria-label={ja ? '閉じる' : bn ? 'বন্ধ করুন' : 'Close image'}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

    </div>
  );
}
