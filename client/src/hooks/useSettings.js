import { useQuery } from '@tanstack/react-query';
import { getData } from '../lib/api';

const FALLBACK = { contact: {}, social: {}, hero: {}, about: {}, pages: {}, seo: {} };

export function useSettings() {
  const { data } = useQuery({ queryKey: ['settings'], queryFn: () => getData('/settings/public'), staleTime: 10 * 60 * 1000 });
  return data || FALLBACK;
}
