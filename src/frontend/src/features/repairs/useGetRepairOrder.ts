import { useQuery } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { RepairOrderRecord } from '@/backend';

export function useGetRepairOrder(repairId: number | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<RepairOrderRecord>({
    queryKey: ['repairOrder', repairId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (repairId === null) throw new Error('Repair ID is required');
      
      try {
        return await actor.getRepairOrder(BigInt(repairId));
      } catch (error: any) {
        // Handle authorization errors
        if (error.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to view this repair order.');
        }
        // Handle not found errors
        if (error.message?.includes('not found')) {
          throw new Error('Repair order not found. It may have been deleted.');
        }
        throw new Error(error.message || 'Failed to load repair order. Please try again.');
      }
    },
    enabled: !!actor && !actorFetching && repairId !== null,
    retry: false
  });
}
