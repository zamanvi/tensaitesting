import { Metadata } from 'next';
import PrivacyPageClient from './PrivacyClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tensaiconsultancy.com';

export const metadata: Metadata = {
  title: 'Privacy Policy — Tensai',
  description: 'Tensai\'s privacy policy explains how we protect your data, secure documents with verification locks, and respect your privacy across the platform.',
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/privacy`,
    title: 'Privacy Policy — Tensai',
    description: 'Tensai\'s privacy policy explains how we protect your data and respect your privacy.',
    siteName: 'Tensai',
    images: [
      {
        url: `${SITE_URL}/api/og?page=privacy`,
        width: 1200,
        height: 630,
        alt: 'Privacy Policy',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy — Tensai',
    description: 'Tensai\'s privacy policy explains how we protect your data and respect your privacy.',
    images: [`${SITE_URL}/api/og?page=privacy`]
  },
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  return <PrivacyPageClient />;
}
