import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useRepos() {
  return useQuery({ queryKey: ['repos'], queryFn: () => api.github.listRepos() });
}

export function useBranches(owner: string, repo: string) {
  return useQuery({
    queryKey: ['branches', owner, repo],
    queryFn: () => api.github.listBranches(owner, repo),
    enabled: Boolean(owner) && Boolean(repo),
  });
}
