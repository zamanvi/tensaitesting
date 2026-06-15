'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InstitutionDashboard() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/institution/profile'); }, [router]);
  return null;
}
