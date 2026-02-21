import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { PiercingFormData } from './piercingTypes';

export function usePlacePiercingService() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: PiercingFormData) => {
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

      // Convert date to nanoseconds (Time format)
      const convertDateToTime = (dateStr: string): bigint => {
        if (!dateStr) return BigInt(Date.now()) * BigInt(1000000);
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return BigInt(Date.now()) * BigInt(1000000);
          // Convert milliseconds to nanoseconds
          return BigInt(date.getTime()) * BigInt(1000000);
        } catch {
          return BigInt(Date.now()) * BigInt(1000000);
        }
      };

      try {
        const serviceId = await actor.addPiercingService(
          convertDateToTime(formData.date),
          formData.name.trim(),
          formData.phone.trim(),
          sanitizeCurrency(formData.amount),
          formData.remarks.trim()
        );
        return Number(serviceId);
      } catch (error: any) {
        // Handle authorization errors
        if (error.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to add piercing services. Please log in.');
        }
        throw new Error(error.message || 'Failed to save piercing service. Please try again.');
      }
    },
    onSuccess: () => {
      // Invalidate piercing services cache
      queryClient.invalidateQueries({ queryKey: ['recentPiercingServices'] });
      queryClient.invalidateQueries({ queryKey: ['piercingStats'] });
    }
  });
}
