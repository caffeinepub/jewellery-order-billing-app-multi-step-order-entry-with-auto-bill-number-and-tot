import { useQuery } from '@tanstack/react-query';
import { useActor } from '../../hooks/useActor';
import type { Employee } from '../../backend';

export function useListEmployees() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');

      try {
        return await actor.listEmployees();
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to view employees.');
        }
        throw new Error(error.message || 'Failed to load employees. Please try again.');
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}
