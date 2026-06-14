import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export type CountryData = Record<string, string[]>; // { Japan: ['Tokyo', ...] }

const FALLBACK: CountryData = { Japan: ['Tokyo', 'Osaka', 'Kyoto', 'Nagoya', 'Sapporo', 'Fukuoka'] };

export function useCountryData() {
  return useQuery<CountryData>({
    queryKey: ['public-countries'],
    queryFn: () =>
      api.get('/settings/public').then(r => {
        const raw = r.data.target_countries;
        return raw ? (JSON.parse(raw) as CountryData) : FALLBACK;
      }),
    staleTime: 1000 * 60 * 10,
    placeholderData: FALLBACK,
  });
}
