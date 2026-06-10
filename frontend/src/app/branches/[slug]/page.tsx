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
  const { lang, toggle } = useLang();
  const ja = lang === 'ja';
  const bn = lang === 'bn';

  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeGallery, setActiveGallery] = useState<string | null>(null);

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

  if (loading) return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
    </div>
  );

  if (notFound || !branch) return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center text-center px-4">
      <div className="text-5xl mb-4">🏢</div>
      <h1 className="text-white font-bold text-xl mb-2">{ja ? '支局が見つかりません' : bn ? 'শাখা পাওয়া যায়নি' : 'Branch not found'}</h1>
      <Link href="/branches" className="mt-4 text-green-400 text-sm hover:underline">← {ja ? '支局一覧へ' : bn ? 'শাখার তালিকায়' : 'Back to Branches'}</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d1117]">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0d1117]/95 backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/tensai-logo.png" alt="Tensai" width={32} height={32} className="rounded-full object-contain" />
            <span className="text-sm font-bold text-white">Tensai</span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10 text-white/60 hover:border-green-500/40 hover:text-green-400 transition-all">
              {lang === 'en' ? 'বাংলা' : lang === 'bn' ? '日本語' : 'English'}
            </button>
            <Link href="/branches" className="text-xs text-white/50 hover:text-white px-3 py-1.5">
              ← {ja ? '支局一覧' : bn ? 'সব শাখা' : 'All Branches'}
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
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branch.cover_image_url} alt={branch.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 to-[#0d1117]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/50 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 pb-12 w-full">
          <div className="flex items-end gap-4">
            {branch.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branch.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-white/20 shrink-0" />
            )}
            <div>
              <p className="text-green-400 text-xs font-semibold mb-1">📍 {branch.city}, {branch.country}</p>
              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">{branch.name}</h1>
              {branch.tagline && <p className="text-white/60 mt-2 text-sm sm:text-base">{branch.tagline}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {branch.stats && Object.keys(branch.stats).length > 0 && (
        <section className="border-y border-white/[0.06] bg-white/[0.02]">
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

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-20">

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
                  {s.icon && <div className="text-3xl mb-3">{s.icon}</div>}
                  <h3 className="font-bold text-white text-sm mb-2">{s.title}</h3>
                  {s.description && <p className="text-white/40 text-xs leading-relaxed">{s.description}</p>}
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
                  <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 border-2 border-white/10 bg-white/[0.04]">
                    {m.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                    )}
                  </div>
                  <p className="font-bold text-white text-sm">{m.name}</p>
                  {m.role && <p className="text-green-400 text-xs mt-0.5">{m.role}</p>}
                  {m.bio && <p className="text-white/35 text-[11px] mt-1 leading-snug line-clamp-2">{m.bio}</p>}
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
                <div key={g.id} className="aspect-square rounded-xl overflow-hidden cursor-pointer group border border-white/[0.06] hover:border-green-500/30 transition-all"
                  onClick={() => setActiveGallery(g.display_image_url)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.display_image_url} alt={g.caption ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact & Info */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Contact */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
            <h2 className="text-lg font-bold text-white mb-5">
              {ja ? '連絡先' : bn ? 'যোগাযোগ' : 'Contact Us'}
            </h2>
            <div className="space-y-3 text-sm">
              {branch.address && (
                <div className="flex gap-3 text-white/60">
                  <span className="shrink-0">🏠</span>
                  <span>{branch.address}</span>
                </div>
              )}
              {branch.phone && (
                <a href={`tel:${branch.phone}`} className="flex gap-3 text-white/60 hover:text-green-400 transition-colors">
                  <span>📞</span><span>{branch.phone}</span>
                </a>
              )}
              {branch.email && (
                <a href={`mailto:${branch.email}`} className="flex gap-3 text-white/60 hover:text-green-400 transition-colors">
                  <span>✉️</span><span>{branch.email}</span>
                </a>
              )}
              {branch.whatsapp && (
                <a href={`https://wa.me/${branch.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex gap-3 text-white/60 hover:text-green-400 transition-colors">
                  <span>💬</span><span>WhatsApp: {branch.whatsapp}</span>
                </a>
              )}
              {branch.google_maps_url && (
                <a href={branch.google_maps_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-green-600/20 border border-green-500/30 text-green-400 text-xs font-semibold rounded-xl hover:bg-green-600/30 transition-all">
                  🗺️ {ja ? 'Google マップで見る' : bn ? 'গুগল ম্যাপে দেখুন' : 'View on Google Maps'}
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
                {Object.entries(branch.working_hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between items-center py-2 border-b border-white/[0.05] last:border-0">
                    <span className="text-white/60 text-sm">{day}</span>
                    <span className={`text-sm font-medium ${hours.toLowerCase().includes('closed') || hours.toLowerCase().includes('বন্ধ') ? 'text-red-400' : 'text-green-400'}`}>
                      {hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="text-center py-10 rounded-2xl bg-gradient-to-br from-green-900/20 to-transparent border border-green-500/10">
          <h2 className="text-2xl font-bold text-white mb-3">
            {ja ? 'まずは無料相談から' : bn ? 'আজই শুরু করুন' : 'Start Your Journey Today'}
          </h2>
          <p className="text-white/45 text-sm mb-6 max-w-md mx-auto">
            {ja ? `${branch.name}のチームがあなたの夢を日本で実現するお手伝いをします。`
              : bn ? `${branch.name} এর টিম আপনার জাপান যাত্রা শুরু করতে সাহায্য করতে প্রস্তুত।`
              : `The ${branch.name} team is ready to help you start your journey to Japan.`}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/auth/register" className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-full text-sm font-bold transition-all">
              {ja ? '無料登録' : bn ? 'বিনামূল্যে রেজিস্ট্রেশন' : 'Register Free'}
            </Link>
            {branch.whatsapp && (
              <a href={`https://wa.me/${branch.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="px-6 py-2.5 bg-white/[0.06] border border-white/[0.12] text-white rounded-full text-sm font-semibold hover:bg-white/[0.1] transition-all">
                💬 WhatsApp
              </a>
            )}
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/tensai-logo.png" alt="Tensai" width={28} height={28} className="rounded-full object-contain" />
            <span className="text-sm font-bold text-white/75">Tensai</span>
          </Link>
          <div className="flex gap-4 text-xs text-white/38">
            <Link href="/about" className="hover:text-white/65">About</Link>
            <Link href="/gallery" className="hover:text-white/65">Gallery</Link>
            <Link href="/branches" className="hover:text-white/65">Branches</Link>
          </div>
          <p className="text-xs text-white/30">© 2026 Tensai. All rights reserved.</p>
        </div>
      </footer>

      {/* Lightbox */}
      {activeGallery && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setActiveGallery(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activeGallery} alt="" className="max-w-full max-h-full object-contain rounded-xl" onClick={e => e.stopPropagation()} />
          <button onClick={() => setActiveGallery(null)} className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl">✕</button>
        </div>
      )}

    </div>
  );
}
