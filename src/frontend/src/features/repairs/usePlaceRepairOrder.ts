import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../../hooks/useActor';
import { sanitizeWeight, currencyToBigIntCents, dateToNanoseconds, validateBigIntRange, formatBackendError } from '../../lib/formatters';

export function usePlaceRepairOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: {
      date: string;
      material: string;
      addedMaterialWeight: string;
      materialCost: string;
      makingCharge: string;
      totalCost: string;
      deliveryDate: string;
      assignTo: string;
      status: string;
      deliveryStatus: string;
    }) => {
      if (!actor) {
        throw new Error('Backend actor not available');
      }

      console.log('=== Creating Repair Order ===');
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
      });

      try {
        const repairId = await actor.createRepairOrder(
          date,
          formData.material,
          addedMaterialWeight,
          materialCost,
          makingCharge,
          totalCost,
          deliveryDate,
          formData.assignTo,
          formData.status,
          formData.deliveryStatus
        );

        console.log('✓ Repair order created successfully with ID:', repairId);
        return repairId;
      } catch (error: any) {
        console.error('✗ Backend error creating repair order:', error);
        const userMessage = formatBackendError(error, 'Failed to create repair order. Please try again.');
        throw new Error(userMessage);
      }
    },
    onSuccess: (repairId) => {
      console.log('Repair order mutation succeeded, invalidating queries for ID:', repairId);
      queryClient.invalidateQueries({ queryKey: ['recentRepairOrders'] });
      queryClient.invalidateQueries({ queryKey: ['repairOrderStats'] });
    },
    onError: (error: any) => {
      console.error('=== Repair Order Creation Failed ===');
      console.error('Error:', error);
    },
  });
}
