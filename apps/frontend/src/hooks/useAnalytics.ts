import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useAnalytics(projectId: string) {
  return useQuery({
    queryKey: ['analytics', projectId],
    queryFn: () => api.analytics.get(projectId),
    enabled: Boolean(projectId),
  });
}
