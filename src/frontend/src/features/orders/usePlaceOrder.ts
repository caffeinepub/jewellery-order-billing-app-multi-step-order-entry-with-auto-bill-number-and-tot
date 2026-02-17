import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { OrderFormData } from './orderTypes';

export function usePlaceOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: OrderFormData) => {
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

      try {
        const billNo = await actor.placeOrder(
          formData.customerName.trim(),
          formData.orderType,
          formData.material,
          formData.item.trim(),
          formData.phoneNo.trim(),
          formData.deliveryDate,
          formData.assignTo.trim(),
          formData.remarks.trim(),
          sanitizeNumber(formData.exchangeWt),
          sanitizeNumber(formData.deductWt),
          sanitizeNumber(formData.addedWt)
        );
        return Number(billNo);
      } catch (error: any) {
        // Handle authorization errors
        if (error.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to create orders. Please log in.');
        }
        throw new Error(error.message || 'Failed to save order. Please try again.');
      }
    },
    onSuccess: () => {
      // Invalidate both recent orders and order stats to refresh all views
      queryClient.invalidateQueries({ queryKey: ['recentOrders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
    }
  });
}
