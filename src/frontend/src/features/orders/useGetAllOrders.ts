import { useQuery } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { OrderRecord } from '@/backend';

export function useGetAllOrders() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<OrderRecord[]>({
    queryKey: ['allOrders'],
    queryFn: async () => {
      if (!actor) {
        console.error('useGetAllOrders: Actor not available');
        throw new Error('Actor not available');
      }
      
      console.log('useGetAllOrders: Fetching all orders...');
      
      try {
        const result = await actor.getAllOrders();
        console.log('useGetAllOrders: Successfully fetched', result.length, 'orders');
        console.log('useGetAllOrders: Sample data:', result[0]);
        return result;
      } catch (error: any) {
        console.error('useGetAllOrders: Error fetching orders:', error);
        
        if (error.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to view orders.');
        }
        throw new Error(error.message || 'Failed to load orders. Please try again.');
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false
  });
}
