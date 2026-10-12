import { Metadata } from 'next';
import CvPublicClient from './CvPublicClient';

// A private, unlisted link: never indexed, never followed.
export const metadata: Metadata = {
  title: 'CV — Tensai Consultancy',
  robots: { index: false, follow: false, nocache: true },
};

export default async function PublicCvPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <CvPublicClient token={token} />;
}
