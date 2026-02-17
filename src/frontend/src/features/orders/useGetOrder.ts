import { useQuery } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { OrderRecord } from '@/backend';

export function useGetOrder(billNo: number | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<OrderRecord>({
    queryKey: ['order', billNo],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (billNo === null) throw new Error('Bill number is required');
      
      try {
        return await actor.getOrder(BigInt(billNo));
      } catch (error: any) {
        // Handle authorization errors
        if (error.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to view this order.');
        }
        // Handle not found errors
        if (error.message?.includes('not found')) {
          throw new Error('Order not found. It may have been deleted.');
        }
        throw new Error(error.message || 'Failed to load order. Please try again.');
      }
    },
    enabled: !!actor && !actorFetching && billNo !== null,
    retry: false
  });
}
