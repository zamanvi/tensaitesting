import { Metadata } from 'next';
import RegisterClient from './RegisterClient';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tensaiconsultancy.com';

// Official Bengali tagline — verbatim, do not paraphrase.
const BN_TAGLINE = 'বিদেশে উচ্চশিক্ষা ও স্বাস্থ্যসেবা খাতে চাকরি খুঁজে পাওয়ার বিশ্বস্ত প্ল্যাটফর্ম';

const COPY: Record<string, { title: string; description: string }> = {
  student: {
    title: '🎓 Join Tensai — The Way of Global Career',
    description: `${BN_TAGLINE}। কোনো ভুয়া প্রতিশ্রুতি নেই — free to join.`,
  },
  agency: {
    title: "🤝 Partner with Tensai — Bangladesh's Trusted Recruitment Network",
    description: 'Join a vetted network of agencies placing students & workers abroad — commission-backed, fraud-verified.',
  },
  institution: {
    title: '🏫 Source Verified Students Through Tensai',
    description: 'Access a growing pool of staff-verified applicants for Japan.',
  },
  affiliate: {
    title: '💰 Earn with Tensai — Refer Students, Get Paid',
    description: 'Join our affiliate network and earn real commissions helping people find a verified path abroad.',
  },
};

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ type?: string; ref?: string }> }
): Promise<Metadata> {
  const { type, ref } = await searchParams;
  const copy = COPY[type ?? 'student'] ?? COPY.student;
  const description = ref
    ? `You've been invited to Tensai. ${copy.description}`
    : copy.description;
  const url = `${SITE_URL}/auth/register${type ? `?type=${type}` : ''}`;

  return {
    title: `${copy.title} — Tensai`,
    description,
    openGraph: {
      type: 'website',
      url,
      title: copy.title,
      description,
      siteName: 'Tensai',
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description,
    },
    alternates: { canonical: url },
  };
}

export default function RegisterPage() {
  return <RegisterClient />;
}
