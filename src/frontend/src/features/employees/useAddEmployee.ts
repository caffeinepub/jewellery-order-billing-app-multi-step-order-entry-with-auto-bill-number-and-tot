import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../../hooks/useActor';
import { formatBackendError } from '../../lib/formatters';

export function useAddEmployee() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; phoneNo: string }) => {
      if (!actor) {
        throw new Error('Backend actor not available');
      }

      if (!data.name.trim()) {
        throw new Error('Employee name is required');
      }

      if (!data.phoneNo.trim()) {
        throw new Error('Phone number is required');
      }

      console.log('=== Creating Employee ===');
      console.log('Employee data:', data);

      try {
        const employeeId = await actor.addEmployee(data.name.trim(), data.phoneNo.trim());
        console.log('✓ Employee created successfully with ID:', employeeId);
        return employeeId;
      } catch (error: any) {
        console.error('✗ Backend error creating employee:', error);
        const userMessage = formatBackendError(error, 'Failed to create employee. Please try again.');
        throw new Error(userMessage);
      }
    },
    onSuccess: () => {
      console.log('Employee mutation succeeded, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      console.error('=== Employee Creation Failed ===');
      console.error('Error:', error);
    },
  });
}
