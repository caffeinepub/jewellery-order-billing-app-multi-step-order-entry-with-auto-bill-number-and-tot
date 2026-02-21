import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { RepairFormData } from './repairTypes';

export function usePlaceRepairOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: RepairFormData) => {
      if (!actor) throw new Error('Actor not available');

      // Sanitize weight fields (store as grams, not multiplied)
      const sanitizeWeight = (value: string): bigint => {
        const trimmed = value.trim();
        if (trimmed === '' || trimmed === '-') return BigInt(0);
        const num = parseFloat(trimmed);
        if (isNaN(num) || !isFinite(num)) return BigInt(0);
        // Store weight as grams (round to nearest gram)
        return BigInt(Math.round(num));
      };

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
        const repairId = await actor.createRepairOrder(
          convertDateToTime(formData.date),
          formData.material,
          sanitizeWeight(formData.addedMaterialWeight), // Weight field
          sanitizeCurrency(formData.materialCost), // Currency field
          sanitizeCurrency(formData.makingCharge), // Currency field
          sanitizeCurrency(formData.totalCost), // Currency field
          convertDateToTime(formData.deliveryDate),
          formData.assignTo.trim(),
          formData.status,
          formData.deliveryStatus
        );
        return Number(repairId);
      } catch (error: any) {
        // Handle authorization errors
        if (error.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to create repair orders. Please log in.');
        }
        throw new Error(error.message || 'Failed to save repair order. Please try again.');
      }
    },
    onSuccess: () => {
      // Invalidate both recent repair orders and repair order stats to refresh all views
      queryClient.invalidateQueries({ queryKey: ['recentRepairOrders'] });
      queryClient.invalidateQueries({ queryKey: ['repairOrderStats'] });
    }
  });
}
