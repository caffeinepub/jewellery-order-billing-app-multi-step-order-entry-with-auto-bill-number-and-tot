import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../../hooks/useActor';
import { sanitizeWeight, dateToNanoseconds, validateBigIntRange, formatBackendError } from '../../lib/formatters';

export function useUpdateOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: {
      billNo: bigint;
      customerName: string;
      orderType: string;
      material: string;
      materialDescription: string;
      palletType: string;
      pickupLocation: string;
      deliveryAddress: string;
      deliveryContact: string;
      netWeight: string;
      grossWeight: string;
      cutWeight: string;
      deliveryDate: string;
    }) => {
      if (!actor) {
        throw new Error('Backend actor not available');
      }

      console.log('=== Updating Order ===');
      console.log('Bill No:', formData.billNo);
      console.log('Form data:', formData);

      // Sanitize and validate weight fields
      const netWeight = sanitizeWeight(formData.netWeight);
      const grossWeight = sanitizeWeight(formData.grossWeight);
      const cutWeight = sanitizeWeight(formData.cutWeight);
      const deliveryDate = dateToNanoseconds(formData.deliveryDate);

      // Validate converted values
      validateBigIntRange(netWeight, 'netWeight', BigInt(0), BigInt(1000000));
      validateBigIntRange(grossWeight, 'grossWeight', BigInt(0), BigInt(1000000));
      validateBigIntRange(cutWeight, 'cutWeight', BigInt(0), BigInt(1000000));
      validateBigIntRange(deliveryDate, 'deliveryDate', BigInt(0), BigInt(Number.MAX_SAFE_INTEGER));

      console.log('Converted values:', {
        netWeight: `${netWeight}n`,
        grossWeight: `${grossWeight}n`,
        cutWeight: `${cutWeight}n`,
        deliveryDate: `${deliveryDate}n`,
      });

      try {
        await actor.updateOrder(
          formData.billNo,
          formData.customerName,
          formData.orderType,
          formData.material,
          formData.materialDescription,
          formData.palletType,
          formData.pickupLocation,
          formData.deliveryAddress,
          formData.deliveryContact,
          netWeight,
          grossWeight,
          cutWeight,
          deliveryDate
        );

        console.log('✓ Order updated successfully');
      } catch (error: any) {
        console.error('✗ Backend error updating order:', error);
        const userMessage = formatBackendError(error, 'Failed to update order. Please try again.');
        throw new Error(userMessage);
      }
    },
    onSuccess: (_, variables) => {
      console.log('Order update mutation succeeded for bill:', variables.billNo);
      queryClient.invalidateQueries({ queryKey: ['recentOrders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
      queryClient.invalidateQueries({ queryKey: ['order', Number(variables.billNo)] });
    },
    onError: (error: any) => {
      console.error('=== Order Update Failed ===');
      console.error('Error:', error);
    },
  });
}
