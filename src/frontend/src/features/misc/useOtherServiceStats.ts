import { useQuery } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { OtherServiceStats } from '@/backend';

export function useOtherServiceStats() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<OtherServiceStats>({
    queryKey: ['otherServiceStats'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      
      try {
        return await actor.getOtherServiceStats();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to view other service statistics.');
        }
        throw new Error(error.message || 'Failed to load other service statistics. Please try again.');
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false
  });
}
