import { useQuery } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { PiercingServiceRecord } from '@/backend';

export function useGetAllPiercingServices() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PiercingServiceRecord[]>({
    queryKey: ['allPiercingServices'],
    queryFn: async () => {
      if (!actor) {
        console.error('useGetAllPiercingServices: Actor not available');
        throw new Error('Actor not available');
      }
      
      console.log('useGetAllPiercingServices: Fetching all piercing services...');
      
      try {
        const result = await actor.getAllPiercingServices();
        console.log('useGetAllPiercingServices: Successfully fetched', result.length, 'services');
        console.log('useGetAllPiercingServices: Sample data:', result[0]);
        return result;
      } catch (error: any) {
        console.error('useGetAllPiercingServices: Error fetching services:', error);
        
        if (error.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to view services.');
        }
        throw new Error(error.message || 'Failed to load piercing services. Please try again.');
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false
  });
}
