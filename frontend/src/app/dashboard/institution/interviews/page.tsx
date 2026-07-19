'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InstitutionInterviewsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/institution/selected'); }, [router]);
  return null;
}
