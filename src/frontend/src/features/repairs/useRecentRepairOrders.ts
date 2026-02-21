import { useQuery } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { RepairOrderRecord } from '@/backend';

export function useRecentRepairOrders(count: number = 10) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<RepairOrderRecord[]>({
    queryKey: ['recentRepairOrders', count],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getRecentRepairOrders(BigInt(count));
    },
    enabled: !!actor && !actorFetching
  });
}
