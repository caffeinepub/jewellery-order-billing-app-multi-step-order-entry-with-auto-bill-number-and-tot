import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../../hooks/useActor';
import { sanitizeWeight, currencyToBigIntCents, dateToNanoseconds, validateBigIntRange, formatBackendError } from '../../lib/formatters';

export function useUpdateRepairOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: {
      repairId: bigint;
      date: string;
      material: string;
      addedMaterialWeight: string;
      materialCost: string;
      makingCharge: string;
      totalCost: string;
      deliveryDate: string;
      assignedTo?: string;
      status: string;
      deliveryStatus: string;
    }) => {
      if (!actor) {
        throw new Error('Backend actor not available');
      }

      console.log('=== Updating Repair Order ===');
      console.log('Repair ID:', formData.repairId);
      console.log('Form data:', formData);

      // Convert and validate all fields
      const date = dateToNanoseconds(formData.date);
      const addedMaterialWeight = sanitizeWeight(formData.addedMaterialWeight);
      const materialCost = currencyToBigIntCents(formData.materialCost);
      const makingCharge = currencyToBigIntCents(formData.makingCharge);
      const totalCost = currencyToBigIntCents(formData.totalCost);
      const deliveryDate = dateToNanoseconds(formData.deliveryDate);

      // Validate converted values
      validateBigIntRange(date, 'date', BigInt(0), BigInt(Number.MAX_SAFE_INTEGER));
      validateBigIntRange(addedMaterialWeight, 'addedMaterialWeight', BigInt(0), BigInt(1000000));
      validateBigIntRange(materialCost, 'materialCost', BigInt(0), BigInt(100000000));
      validateBigIntRange(makingCharge, 'makingCharge', BigInt(0), BigInt(100000000));
      validateBigIntRange(totalCost, 'totalCost', BigInt(0), BigInt(100000000));
      validateBigIntRange(deliveryDate, 'deliveryDate', BigInt(0), BigInt(Number.MAX_SAFE_INTEGER));

      console.log('Converted values:', {
        date: `${date}n`,
        addedMaterialWeight: `${addedMaterialWeight}n`,
        materialCost: `${materialCost}n`,
        makingCharge: `${makingCharge}n`,
        totalCost: `${totalCost}n`,
        deliveryDate: `${deliveryDate}n`,
        assignedTo: formData.assignedTo || '',
      });

      try {
        await actor.updateRepairOrder(
          formData.repairId,
          date,
          formData.material,
          addedMaterialWeight,
          materialCost,
          makingCharge,
          totalCost,
          deliveryDate,
          formData.assignedTo || '',
          formData.status,
          formData.deliveryStatus
        );

        console.log('✓ Repair order updated successfully');
      } catch (error: any) {
        console.error('✗ Backend error updating repair order:', error);
        const userMessage = formatBackendError(error, 'Failed to update repair order. Please try again.');
        throw new Error(userMessage);
      }
    },
    onSuccess: (_, variables) => {
      console.log('Repair order update mutation succeeded, invalidating queries for ID:', variables.repairId);
      queryClient.invalidateQueries({ queryKey: ['recentRepairOrders'] });
      queryClient.invalidateQueries({ queryKey: ['repairOrderStats'] });
      queryClient.invalidateQueries({ queryKey: ['repairOrder', variables.repairId] });
    },
    onError: (error: any) => {
      console.error('=== Repair Order Update Failed ===');
      console.error('Error:', error);
    },
  });
}
