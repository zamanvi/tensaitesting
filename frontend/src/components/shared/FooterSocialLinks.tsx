'use client';
import { PUBLIC_API } from '@/lib/publicApi';
import { useQuery } from '@tanstack/react-query';

// Facebook + YouTube icons for the public-page footers. The URLs come from
// Admin → Site Settings → Social Media Links, the same source as the header and
// the home footer, so nothing is rendered until a URL is set there.
// Same query key/fetch as SiteHeader → React Query shares ONE /settings/public
// request per page instead of adding another.
export default function FooterSocialLinks() {
  const { data: settings } = useQuery<{ facebook_url?: string; youtube_url?: string }>({
    queryKey: ['public-settings'],
    queryFn: () =>
      fetch(`${PUBLIC_API}/settings/public`).then((r) => {
        if (!r.ok) throw new Error(`settings/public ${r.status}`);
        return r.json();
      }),
    staleTime: 0,
    retry: false,
  });

  if (!settings?.facebook_url && !settings?.youtube_url) return null;

  const cls =
    'inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20 transition-all';

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      {settings?.facebook_url && (
        <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={cls}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
          </svg>
        </a>
      )}
      {settings?.youtube_url && (
        <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className={cls}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
            <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#0d1117" />
          </svg>
        </a>
      )}
    </div>
  );
}
