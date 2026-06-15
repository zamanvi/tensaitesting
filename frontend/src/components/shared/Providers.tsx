'use client';
import { LanguageProvider } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

function AuthHydrator() {
  // Rehydrate synchronously so the store is ready before first paint
  useState(() => { useAuthStore.persist.rehydrate(); });
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
      },
    },
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
