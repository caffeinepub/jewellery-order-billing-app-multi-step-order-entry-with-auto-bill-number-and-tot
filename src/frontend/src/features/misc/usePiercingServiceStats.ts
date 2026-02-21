import { useQuery } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { PiercingStats } from '@/backend';

export function usePiercingServiceStats() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PiercingStats>({
    queryKey: ['piercingServiceStats'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      
      try {
        return await actor.getPiercingStats();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to view piercing statistics.');
        }
        throw new Error(error.message || 'Failed to load piercing statistics. Please try again.');
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false
  });
}
