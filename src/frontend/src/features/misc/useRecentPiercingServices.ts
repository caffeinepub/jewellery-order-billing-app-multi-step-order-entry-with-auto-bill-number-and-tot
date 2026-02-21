import { useQuery } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { PiercingServiceRecord } from '@/backend';

export function useRecentPiercingServices(count: number = 10) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PiercingServiceRecord[]>({
    queryKey: ['recentPiercingServices', count],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      
      try {
        return await actor.getRecentPiercingServices(BigInt(count));
      } catch (error: any) {
        // Handle authorization errors
        if (error.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to view services.');
        }
        throw new Error(error.message || 'Failed to load services. Please try again.');
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false
  });
}
