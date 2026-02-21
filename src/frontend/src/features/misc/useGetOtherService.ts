import { useQuery } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { OtherServiceRecord } from '@/backend';

export function useGetOtherService(serviceId: number | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<OtherServiceRecord>({
    queryKey: ['otherService', serviceId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (serviceId === null) throw new Error('Service ID is required');
      
      try {
        return await actor.getOtherService(BigInt(serviceId));
      } catch (error: any) {
        // Handle authorization errors
        if (error.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to view this service.');
        }
        // Handle not found errors
        if (error.message?.includes('not found')) {
          throw new Error('Service not found. It may have been deleted.');
        }
        throw new Error(error.message || 'Failed to load service. Please try again.');
      }
    },
    enabled: !!actor && !actorFetching && serviceId !== null,
    retry: false
  });
}
