import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../../hooks/useActor';
import { currencyToBigIntCents, dateToNanoseconds, validateBigIntRange, formatBackendError } from '../../lib/formatters';

export function usePlacePiercingService() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: {
      date: string;
      name: string;
      phone: string;
      amount: string;
      remarks: string;
    }) => {
      if (!actor) {
        throw new Error('Backend actor not available');
      }

      console.log('=== Creating Piercing Service ===');
      console.log('Form data:', formData);

      // Convert and validate fields
      const date = dateToNanoseconds(formData.date);
      const amount = currencyToBigIntCents(formData.amount);

      // Validate converted values
      validateBigIntRange(date, 'date', BigInt(0), BigInt(Number.MAX_SAFE_INTEGER));
      validateBigIntRange(amount, 'amount', BigInt(0), BigInt(100000000));

      console.log('Converted values:', {
        date: `${date}n`,
        amount: `${amount}n`,
      });

      try {
        const serviceId = await actor.addPiercingService(
          date,
          formData.name,
          formData.phone,
          amount,
          formData.remarks
        );

        console.log('✓ Piercing service created successfully with ID:', serviceId);
        return serviceId;
      } catch (error: any) {
        console.error('✗ Backend error creating piercing service:', error);
        const userMessage = formatBackendError(error, 'Failed to create piercing service. Please try again.');
        throw new Error(userMessage);
      }
    },
    onSuccess: (serviceId) => {
      console.log('Piercing service mutation succeeded, invalidating queries for ID:', serviceId);
      queryClient.invalidateQueries({ queryKey: ['recentPiercingServices'] });
      queryClient.invalidateQueries({ queryKey: ['piercingStats'] });
    },
    onError: (error: any) => {
      console.error('=== Piercing Service Creation Failed ===');
      console.error('Error:', error);
    },
  });
}
