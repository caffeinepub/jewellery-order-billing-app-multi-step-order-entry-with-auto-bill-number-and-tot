import { useQuery } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { OrderRecord } from '@/backend';

export function useRecentOrders(count: number = 10) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<OrderRecord[]>({
    queryKey: ['recentOrders', count],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getRecentOrders(BigInt(count));
    },
    enabled: !!actor && !actorFetching
  });
}

