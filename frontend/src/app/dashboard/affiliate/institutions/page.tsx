'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AffiliateInstitutionsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/affiliate/referral'); }, [router]);
  return null;
}
