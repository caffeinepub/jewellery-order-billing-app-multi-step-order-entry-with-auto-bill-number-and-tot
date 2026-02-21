import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { OtherFormData } from './otherTypes';

export function usePlaceOtherService() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: OtherFormData) => {
      if (!actor) throw new Error('Actor not available');

      // Sanitize currency fields (store as cents by multiplying by 100)
      const sanitizeCurrency = (value: string): bigint => {
        const trimmed = value.trim();
        if (trimmed === '' || trimmed === '-') return BigInt(0);
        const num = parseFloat(trimmed);
        if (isNaN(num) || !isFinite(num)) return BigInt(0);
        // Convert to integer by multiplying by 100 (store as cents)
        return BigInt(Math.round(num * 100));
      };

      try {
        const serviceId = await actor.addOtherService(
          formData.name.trim(),
          formData.phone.trim(),
          sanitizeCurrency(formData.amount),
          formData.remarks.trim()
        );
        return Number(serviceId);
      } catch (error: any) {
        // Handle authorization errors
        if (error.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to add other services. Please log in.');
        }
        throw new Error(error.message || 'Failed to save other service. Please try again.');
      }
    },
    onSuccess: () => {
      // Invalidate other services cache
      queryClient.invalidateQueries({ queryKey: ['recentOtherServices'] });
      queryClient.invalidateQueries({ queryKey: ['otherServiceStats'] });
    }
  });
}
