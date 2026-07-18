import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CommitMessageContext } from '@/lib/types';

export function useSuggestCommit() {
  return useMutation({
    mutationFn: (context: CommitMessageContext) => api.ai.suggestCommitMessage(context),
  });
}
