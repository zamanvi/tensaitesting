import { Metadata } from 'next';
import FeedClient, { type FeedInitialData } from './FeedClient';
import { snapshot } from '@/lib/serverSnapshot';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tensaiconsultancy.com';
const FALLBACK_IMAGE = `${SITE_URL}/tensai-logo.png`;

async function fetchLatestPost() {
  try {
    const res = await fetch(`${API}/feed?limit=1`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[0] ?? null;
  } catch {
    return null;
  }
}

function ogImage(thumbnail: string | null): string {
  if (!thumbnail) return FALLBACK_IMAGE;
  if (thumbnail.includes('unsplash.com')) {
    const base = thumbnail.split('?')[0];
    return `${base}?w=1200&h=630&fit=crop&q=85&auto=format`;
  }
  return thumbnail;
}

export async function generateMetadata(): Promise<Metadata> {
  const latestPost = await fetchLatestPost();
  const image = ogImage(latestPost?.thumbnail ?? null);

  // Optimized for social media display (60 chars max for title, 160 for description)
  const title = '📖 বিদেশে যাওয়ার গাইড — Tensai';
  const description = 'বিদেশে পড়াশোনা, স্বাস্থ্যসেবা ও কাজের ভিসায় বিশ্বস্ত পরামর্শ';

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/feed`,
      title,
      description,
      siteName: 'Tensai',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: latestPost?.title ?? title,
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: { canonical: `${SITE_URL}/feed` },
  };
}

export default async function FeedPage() {
  const [feed, categories] = await Promise.all([
    snapshot<NonNullable<FeedInitialData['feed']>>('/feed'),
    snapshot<NonNullable<FeedInitialData['categories']>>('/feed-categories'),
  ]);

  const initial: FeedInitialData = {
    feed: feed && Array.isArray(feed.data) ? feed : null,
    categories: categories && typeof categories === 'object' && !Array.isArray(categories) ? categories : null,
  };

  return <FeedClient initial={initial} />;
}
