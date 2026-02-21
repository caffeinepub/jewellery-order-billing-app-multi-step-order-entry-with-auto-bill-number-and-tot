import { useQuery } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { RepairOrderRecord } from '@/backend';

export function useGetAllRepairOrders() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<RepairOrderRecord[]>({
    queryKey: ['allRepairOrders'],
    queryFn: async () => {
      if (!actor) {
        console.error('useGetAllRepairOrders: Actor not available');
        throw new Error('Actor not available');
      }
      
      console.log('useGetAllRepairOrders: Fetching all repair orders...');
      
      try {
        const result = await actor.getAllRepairOrders();
        console.log('useGetAllRepairOrders: Successfully fetched', result.length, 'repair orders');
        console.log('useGetAllRepairOrders: Sample data:', result[0]);
        return result;
      } catch (error: any) {
        console.error('useGetAllRepairOrders: Error fetching repair orders:', error);
        
        if (error.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to view repair orders.');
        }
        throw new Error(error.message || 'Failed to load repair orders. Please try again.');
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false
  });
}
