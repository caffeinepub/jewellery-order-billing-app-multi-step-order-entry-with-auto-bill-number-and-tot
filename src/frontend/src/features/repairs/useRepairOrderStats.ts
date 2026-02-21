import { useQuery } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { RepairOrderStats } from '@/backend';

export function useRepairOrderStats() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<RepairOrderStats>({
    queryKey: ['repairOrderStats'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getRepairOrderStats();
    },
    enabled: !!actor && !actorFetching,
    retry: 1
  });
}
