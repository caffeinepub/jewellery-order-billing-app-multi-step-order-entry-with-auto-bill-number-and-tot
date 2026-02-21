import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { RepairFormData } from './repairTypes';

export function useUpdateRepairOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ repairId, formData }: { repairId: number; formData: RepairFormData }) => {
      if (!actor) throw new Error('Actor not available');

      // Sanitize and convert numeric fields to BigInt
      const sanitizeNumber = (value: string): bigint => {
        const trimmed = value.trim();
        if (trimmed === '' || trimmed === '-') return BigInt(0);
        const num = parseFloat(trimmed);
        if (isNaN(num) || !isFinite(num)) return BigInt(0);
        // Convert to integer by multiplying by 100 (store as cents/hundredths)
        return BigInt(Math.round(num * 100));
      };

      // Convert date to nanoseconds (Time format)
      const convertDateToTime = (dateStr: string): bigint => {
        if (!dateStr) return BigInt(0);
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return BigInt(0);
          // Convert milliseconds to nanoseconds
          return BigInt(date.getTime()) * BigInt(1000000);
        } catch {
          return BigInt(0);
        }
      };

      try {
        await actor.updateRepairOrder(
          BigInt(repairId),
          convertDateToTime(formData.date),
          formData.material,
          sanitizeNumber(formData.addedMaterialWeight),
          sanitizeNumber(formData.materialCost),
          sanitizeNumber(formData.makingCharge),
          sanitizeNumber(formData.totalCost),
          convertDateToTime(formData.deliveryDate),
          formData.assignTo.trim(),
          formData.status,
          formData.deliveryStatus
        );
      } catch (error: any) {
        // Handle authorization errors
        if (error.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to update repair orders.');
        }
        // Handle not found errors
        if (error.message?.includes('not found')) {
          throw new Error('Repair order not found. It may have been deleted.');
        }
        throw new Error(error.message || 'Failed to update repair order. Please try again.');
      }
    },
    onSuccess: () => {
      // Invalidate both recent repair orders and repair order stats to refresh all views
      queryClient.invalidateQueries({ queryKey: ['recentRepairOrders'] });
      queryClient.invalidateQueries({ queryKey: ['repairOrderStats'] });
    }
  });
}
