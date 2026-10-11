import { Metadata } from 'next';
import MobilityClient from './MobilityClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tensaiconsultancy.com';
const title = 'Skilled Worker Mobility — Tensai';
const description = 'Skilled worker profiles with video portfolios and career guidance, by Tensai Consultancy.';

export const metadata: Metadata = {
  title,
  description,
  // Placeholder until the section launches — remove this line to let search engines index it.
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE_URL}/mobility` },
};

export default function MobilityPage() {
  return <MobilityClient />;
}
