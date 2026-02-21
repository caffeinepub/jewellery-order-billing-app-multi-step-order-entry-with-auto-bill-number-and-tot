import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../../hooks/useActor';
import { sanitizeWeight, validateBigIntRange, formatBackendError } from '../../lib/formatters';

export function usePlaceOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: {
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
    }) => {
      if (!actor) {
        throw new Error('Backend actor not available');
      }

      console.log('=== Creating Order ===');
      console.log('Form data:', formData);

      // Sanitize and validate weight fields
      const netWeight = sanitizeWeight(formData.netWeight);
      const grossWeight = sanitizeWeight(formData.grossWeight);
      const cutWeight = sanitizeWeight(formData.cutWeight);

      // Validate converted values
      validateBigIntRange(netWeight, 'netWeight', BigInt(0), BigInt(1000000));
      validateBigIntRange(grossWeight, 'grossWeight', BigInt(0), BigInt(1000000));
      validateBigIntRange(cutWeight, 'cutWeight', BigInt(0), BigInt(1000000));

      console.log('Converted weights:', {
        netWeight: `${netWeight}n`,
        grossWeight: `${grossWeight}n`,
        cutWeight: `${cutWeight}n`,
      });

      try {
        const billNo = await actor.placeOrder(
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
          cutWeight
        );

        console.log('✓ Order created successfully with bill number:', billNo);
        return billNo;
      } catch (error: any) {
        console.error('✗ Backend error creating order:', error);
        const userMessage = formatBackendError(error, 'Failed to create order. Please try again.');
        throw new Error(userMessage);
      }
    },
    onSuccess: (billNo) => {
      console.log('Order mutation succeeded, invalidating queries for bill:', billNo);
      queryClient.invalidateQueries({ queryKey: ['recentOrders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
    },
    onError: (error: any) => {
      console.error('=== Order Creation Failed ===');
      console.error('Error:', error);
    },
  });
}
