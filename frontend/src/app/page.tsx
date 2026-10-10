import { Metadata } from 'next';
import HomePageClient, { type HomeInitialData } from './PageClient';
import { PUBLIC_API } from '@/lib/publicApi';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tensaiconsultancy.com';

// Server-side snapshot of the three public calls the home page makes, cached for 60s by
// Next. Every failure (timeout, non-200, bad JSON) resolves to null, which makes the page
// fall back to its old behaviour (skeleton + browser fetch). Never throws, never blocks
// longer than the timeout.
async function snapshot<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${PUBLIC_API}${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: 'Tensai — The Way of Global Career',
  description: 'The Way of Global Career. Tensai connects verified students with global institutions through a transparent, fraud-proof digital ecosystem.',
  keywords: ['global career', 'study abroad', 'Japan', 'student visa', 'agency', 'Tensai'],
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: 'Tensai — The Way of Global Career',
    description: 'The Way of Global Career. Tensai connects verified students with global institutions through a transparent, fraud-proof digital ecosystem.',
    siteName: 'Tensai',
    images: [
      {
        url: `${SITE_URL}/api/og?page=home`,
        width: 1200,
        height: 630,
        alt: 'Tensai — The Way of Global Career',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tensai — The Way of Global Career',
    description: 'The Way of Global Career. Connect. Verify. Succeed.',
    images: [`${SITE_URL}/api/og?page=home`],
  },
  alternates: { canonical: SITE_URL },
};

export default async function HomePage() {
  const [settings, feed, featured] = await Promise.all([
    snapshot<NonNullable<HomeInitialData['settings']>>('/settings/public'),
    snapshot<{ data?: NonNullable<HomeInitialData['guide']>['data'] }>('/feed'),
    snapshot<NonNullable<HomeInitialData['featured']>>('/gallery/featured'),
  ]);

  const initial: HomeInitialData = {
    // Plain-object check: an error page / array would be wrong data for these fields.
    settings: settings && !Array.isArray(settings) && typeof settings === 'object' ? settings : null,
    // The home page only shows 3 guide cards — don't ship the other 9 posts in the HTML.
    guide: feed && Array.isArray(feed.data) ? { data: feed.data.slice(0, 3) } : null,
    featured: Array.isArray(featured) ? featured : null,
  };

  return <HomePageClient initial={initial} />;
}
