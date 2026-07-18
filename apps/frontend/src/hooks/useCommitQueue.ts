import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const PAGE_SIZE = 10;

export function useQueue(projectId: string, page = 1) {
  return useQuery({
    queryKey: ['queue', projectId, page],
    queryFn: () => api.queue.getQueue(projectId, page, PAGE_SIZE),
    enabled: Boolean(projectId),
  });
}

export function useFullQueue(projectId: string) {
  return useQuery({
    queryKey: ['queue-full', projectId],
    queryFn: () => api.queue.getQueue(projectId, 1, 1000),
    enabled: Boolean(projectId),
  });
}

export function useReorderQueue(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.queue.reorder(projectId, ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue', projectId] }),
  });
}
