import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';

// This file is kept for potential future use with backend queries
// Currently not used as profile functionality is not available in backend

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
    retry: false
  });
}

