import { Metadata } from 'next';
import HomePageClient, { type HomeInitialData } from './PageClient';
import { snapshot } from '@/lib/serverSnapshot';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tensaiconsultancy.com';

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
