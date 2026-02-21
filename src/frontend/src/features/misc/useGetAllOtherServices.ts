import { useQuery } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { OtherServiceRecord } from '@/backend';

export function useGetAllOtherServices() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<OtherServiceRecord[]>({
    queryKey: ['allOtherServices'],
    queryFn: async () => {
      if (!actor) {
        console.error('useGetAllOtherServices: Actor not available');
        throw new Error('Actor not available');
      }
      
      console.log('useGetAllOtherServices: Fetching all other services...');
      
      try {
        const result = await actor.getAllOtherServices();
        console.log('useGetAllOtherServices: Successfully fetched', result.length, 'services');
        console.log('useGetAllOtherServices: Sample data:', result[0]);
        return result;
      } catch (error: any) {
        console.error('useGetAllOtherServices: Error fetching services:', error);
        
        if (error.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to view services.');
        }
        throw new Error(error.message || 'Failed to load other services. Please try again.');
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false
  });
}
