import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import type { OrderFormData } from './orderTypes';

export function useUpdateOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ billNo, formData }: { billNo: number; formData: OrderFormData }) => {
      if (!actor) throw new Error('Actor not available');

      // Sanitize and convert numeric fields to BigInt (same approach as usePlaceOrder)
      const sanitizeNumber = (value: string): bigint => {
        const trimmed = value.trim();
        if (trimmed === '' || trimmed === '-') return BigInt(0);
        const num = parseFloat(trimmed);
        if (isNaN(num) || !isFinite(num)) return BigInt(0);
        // Convert to integer by multiplying by 100 (store as cents/hundredths)
        return BigInt(Math.round(num * 100));
      };

      // Convert delivery date to nanoseconds (Time format)
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
        await actor.updateOrder(
          BigInt(billNo),
          formData.customerName.trim(),
          formData.orderType,
          formData.material,
          formData.item.trim(),
          formData.remarks.trim(), // palletType field used for remarks
          formData.status, // pickupLocation field used for status
          formData.assignTo.trim(), // deliveryAddress field used for assignTo
          formData.phoneNo.trim(), // deliveryContact field
          sanitizeNumber(formData.exchangeWt), // netWeight
          sanitizeNumber(formData.addedWt), // grossWeight
          sanitizeNumber(formData.deductWt), // cutWeight
          convertDateToTime(formData.deliveryDate) // deliveryDate as Time
        );
      } catch (error: any) {
        // Handle authorization errors
        if (error.message?.includes('Unauthorized')) {
          throw new Error('You do not have permission to update orders.');
        }
        // Handle not found errors
        if (error.message?.includes('not found')) {
          throw new Error('Order not found. It may have been deleted.');
        }
        throw new Error(error.message || 'Failed to update order. Please try again.');
      }
    },
    onSuccess: () => {
      // Invalidate both recent orders and order stats to refresh all views
      queryClient.invalidateQueries({ queryKey: ['recentOrders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
    }
  });
}
