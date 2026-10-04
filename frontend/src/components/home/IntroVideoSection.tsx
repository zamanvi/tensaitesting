'use client';

import { useState } from 'react';
import { useLang } from '@/context/LanguageContext';

// Pulls the 11-character video id out of the usual ways a YouTube link gets
// copied: watch?v=…, youtu.be/…, /embed/…, /shorts/…, /live/….
// Anything else (empty, malformed, non-YouTube) returns null — the home page
// then keeps its original centered banner, with no video, until a valid link
// is saved under Site Settings in the admin panel.
export function getYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^(www|m)\./, '');
    let id: string | null = null;

    if (host === 'youtu.be') {
      id = u.pathname.slice(1).split('/')[0];
    } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') {
        id = u.searchParams.get('v');
      } else {
        const m = u.pathname.match(/^\/(embed|shorts|live|v)\/([^/?]+)/);
        if (m) id = m[2];
      }
    }

    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

// The player card itself — it lives inside the home page's top banner
// (beside the headline on desktop, below the buttons on phones).
export default function IntroVideoPlayer({ url }: { url?: string | null }) {
  const { lang } = useLang();
  const ja = lang === 'ja';
  const bn = lang === 'bn';
  const [playing, setPlaying] = useState(false);

  const id = getYouTubeId(url);
  if (!id) return null;

  const title = ja ? '紹介動画' : bn ? 'ইন্ট্রো ভিডিও' : 'Intro Video';

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/[0.1] bg-black shadow-2xl shadow-green-900/30">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        // Click-to-play: the YouTube player (and its tracking/scripts) only
        // loads once the visitor actually presses play, so the home page
        // itself stays as fast as before.
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={ja ? '動画を再生' : bn ? 'ভিডিও চালান' : 'Play video'}
          className="group absolute inset-0 h-full w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-85 transition-opacity duration-300 group-hover:opacity-100"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" aria-hidden="true" />
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <span className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-900/40 transition-transform duration-300 group-hover:scale-110">
              <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-7 w-7 sm:h-9 sm:w-9">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
