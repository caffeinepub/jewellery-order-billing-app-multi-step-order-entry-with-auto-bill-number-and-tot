import { useQuery } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { OrderStats } from '@/backend';

export function useOrderStats() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<OrderStats>({
    queryKey: ['orderStats'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getOrderStats();
    },
    enabled: !!actor && !actorFetching,
    retry: 1
  });
}
