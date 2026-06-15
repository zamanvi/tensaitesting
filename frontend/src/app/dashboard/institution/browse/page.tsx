'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InstitutionBrowseRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/institution/applications'); }, [router]);
  return null;
}
