'use client';
import { LanguageProvider } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

function AuthHydrator() {
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthHydrator />
        {children}
      </LanguageProvider>
    </QueryClientProvider>
  );
}
