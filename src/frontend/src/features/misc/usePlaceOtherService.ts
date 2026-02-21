import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../../hooks/useActor';
import { currencyToBigIntCents, validateBigIntRange, formatBackendError } from '../../lib/formatters';

export function usePlaceOtherService() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: {
      name: string;
      phone: string;
      amount: string;
      remarks: string;
    }) => {
      if (!actor) {
        throw new Error('Backend actor not available');
      }

      console.log('=== Creating Other Service ===');
      console.log('Form data:', formData);

      // Convert and validate amount
      const amount = currencyToBigIntCents(formData.amount);

      // Validate converted value
      validateBigIntRange(amount, 'amount', BigInt(0), BigInt(100000000));

      console.log('Converted values:', {
        amount: `${amount}n`,
      });

      try {
        const serviceId = await actor.addOtherService(
          formData.name,
          formData.phone,
          amount,
          formData.remarks
        );

        console.log('✓ Other service created successfully with ID:', serviceId);
        return serviceId;
      } catch (error: any) {
        console.error('✗ Backend error creating other service:', error);
        const userMessage = formatBackendError(error, 'Failed to create other service. Please try again.');
        throw new Error(userMessage);
      }
    },
    onSuccess: (serviceId) => {
      console.log('Other service mutation succeeded, invalidating queries for ID:', serviceId);
      queryClient.invalidateQueries({ queryKey: ['recentOtherServices'] });
      queryClient.invalidateQueries({ queryKey: ['otherServiceStats'] });
    },
    onError: (error: any) => {
      console.error('=== Other Service Creation Failed ===');
      console.error('Error:', error);
    },
  });
}
