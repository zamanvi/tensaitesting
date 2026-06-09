'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page was replaced by /dashboard/affiliate/students.
// Redirect existing bookmarks so nothing breaks.
export default function AffiliateReferralsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/affiliate/students');
  }, [router]);
  return null;
}
