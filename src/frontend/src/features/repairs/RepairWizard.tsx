import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StepIndicator from '../../components/StepIndicator';
import { usePlaceRepairOrder } from './usePlaceRepairOrder';
import { useUpdateRepairOrder } from './useUpdateRepairOrder';
import { useGetRepairOrder } from './useGetRepairOrder';
import { useListEmployees } from '../employees/useListEmployees';
import { REPAIR_MATERIALS, REPAIR_STATUSES, DELIVERY_STATUSES, RepairFormData, initialRepairFormData } from './repairTypes';
import { toast } from 'sonner';

interface RepairWizardProps {
  onCancel: () => void;
  onSuccess: (repairId: bigint) => void;
  editRepairId?: number | null;
}

export default function RepairWizard({ onCancel, onSuccess, editRepairId }: RepairWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RepairFormData>(initialRepairFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof RepairFormData, string>>>({});

  const isEditMode = editRepairId !== null && editRepairId !== undefined;
  const { data: existingRepairOrder, isLoading: isLoadingRepairOrder } = useGetRepairOrder(editRepairId || 0);
  const { data: employees = [], isLoading: isLoadingEmployees } = useListEmployees();

  const placeRepairOrderMutation = usePlaceRepairOrder();
  const updateRepairOrderMutation = useUpdateRepairOrder();

  useEffect(() => {
    if (isEditMode && existingRepairOrder) {
      const dateValue = existingRepairOrder.date ? new Date(Number(existingRepairOrder.date) / 1_000_000).toISOString().split('T')[0] : '';
      const deliveryDateValue = existingRepairOrder.deliveryDate ? new Date(Number(existingRepairOrder.deliveryDate) / 1_000_000).toISOString().split('T')[0] : '';

      setFormData({
        date: dateValue,
        material: existingRepairOrder.material as '' | 'Gold' | 'Silver' | 'Other',
        addedMaterialWeight: (Number(existingRepairOrder.addedMaterialWeight)).toFixed(2),
        materialCost: (Number(existingRepairOrder.materialCost) / 100).toFixed(2),
        makingCharge: (Number(existingRepairOrder.makingCharge) / 100).toFixed(2),
        totalCost: (Number(existingRepairOrder.totalCost) / 100).toFixed(2),
        deliveryDate: deliveryDateValue,
        assignedTo: existingRepairOrder.assignTo,
        status: existingRepairOrder.status as '' | 'On process' | 'Complete',
        deliveryStatus: existingRepairOrder.deliveryStatus as '' | 'Pending' | 'Delivered',
      });
    }
  }, [isEditMode, existingRepairOrder]);

  useEffect(() => {
    const materialCost = parseFloat(formData.materialCost) || 0;
    const makingCharge = parseFloat(formData.makingCharge) || 0;
    const total = materialCost + makingCharge;
    setFormData((prev) => ({ ...prev, totalCost: total.toFixed(2) }));
  }, [formData.materialCost, formData.makingCharge]);

  const handleInputChange = (field: keyof RepairFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof RepairFormData, string>> = {};

    if (step === 1) {
      if (!formData.material) newErrors.material = 'Material is required';
    }

    if (step === 2) {
      if (!formData.materialCost || parseFloat(formData.materialCost) < 0) {
        newErrors.materialCost = 'Valid material cost is required';
      }
      if (!formData.makingCharge || parseFloat(formData.makingCharge) < 0) {
        newErrors.makingCharge = 'Valid making charge is required';
      }
    }

    if (step === 3) {
      if (!formData.status) newErrors.status = 'Status is required';
      if (!formData.deliveryStatus) newErrors.deliveryStatus = 'Delivery status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    try {
      console.log('Submitting repair order form:', formData);

      if (isEditMode && editRepairId) {
        console.log('Updating repair order:', editRepairId);
        await updateRepairOrderMutation.mutateAsync({
          repairId: BigInt(editRepairId),
          ...formData,
        });
        toast.success('Repair order updated successfully!');
        onSuccess(BigInt(editRepairId));
      } else {
        console.log('Creating new repair order');
        const repairId = await placeRepairOrderMutation.mutateAsync(formData);
        toast.success('Repair order created successfully!');
        onSuccess(repairId);
      }
    } catch (error: any) {
      console.error('Error submitting repair order:', error);
      const errorMessage = error?.message || 'Failed to save repair order';
      toast.error(errorMessage);
    }
  };

  const isLoading = placeRepairOrderMutation.isPending || updateRepairOrderMutation.isPending;
  const isWeightDisabled = formData.material === 'Other';
  const isMaterialCostDisabled = formData.material === 'Other';

  if (isEditMode && isLoadingRepairOrder) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading repair order...</p>
        </div>
      </div>
    );
  }

  const stepLabels = ['Basic Details', 'Costs', 'Delivery & Status'];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">{isEditMode ? 'Edit Repair Order' : 'Create Repair Order'}</h2>
        <StepIndicator currentStep={currentStep} totalSteps={3} stepLabels={stepLabels} />
      </div>

      <div className="space-y-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="material">Material *</Label>
              <Select value={formData.material} onValueChange={(value) => handleInputChange('material', value)}>
                <SelectTrigger className={errors.material ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {REPAIR_MATERIALS.map((material) => (
                    <SelectItem key={material} value={material}>
                      {material}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.material && <p className="text-sm text-destructive mt-1">{errors.material}</p>}
            </div>

            <div>
              <Label htmlFor="addedMaterialWeight">Added Material Weight (grams)</Label>
              <Input
                id="addedMaterialWeight"
                type="number"
                step="0.01"
                value={formData.addedMaterialWeight}
                onChange={(e) => handleInputChange('addedMaterialWeight', e.target.value)}
                disabled={isWeightDisabled}
                className={isWeightDisabled ? 'bg-muted' : ''}
              />
            </div>

            <div>
              <Label htmlFor="assignedTo">Assign To</Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) => handleInputChange('assignedTo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingEmployees ? "Loading employees..." : "Select employee (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={String(employee.id)} value={employee.name}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="materialCost">Material Cost (₹) *</Label>
              <Input
                id="materialCost"
                type="number"
                step="0.01"
                value={formData.materialCost}
                onChange={(e) => handleInputChange('materialCost', e.target.value)}
                disabled={isMaterialCostDisabled}
                className={`${errors.materialCost ? 'border-destructive' : ''} ${isMaterialCostDisabled ? 'bg-muted' : ''}`}
              />
              {errors.materialCost && <p className="text-sm text-destructive mt-1">{errors.materialCost}</p>}
            </div>

            <div>
              <Label htmlFor="makingCharge">Making Charge (₹) *</Label>
              <Input
                id="makingCharge"
                type="number"
                step="0.01"
                value={formData.makingCharge}
                onChange={(e) => handleInputChange('makingCharge', e.target.value)}
                className={errors.makingCharge ? 'border-destructive' : ''}
              />
              {errors.makingCharge && <p className="text-sm text-destructive mt-1">{errors.makingCharge}</p>}
            </div>

            <div>
              <Label htmlFor="totalCost">Total Cost (₹)</Label>
              <Input id="totalCost" type="text" value={formData.totalCost} disabled className="bg-muted" />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="deliveryDate">Delivery Date</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className={errors.status ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {REPAIR_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-destructive mt-1">{errors.status}</p>}
            </div>

            <div>
              <Label htmlFor="deliveryStatus">Delivery Status *</Label>
              <Select value={formData.deliveryStatus} onValueChange={(value) => handleInputChange('deliveryStatus', value)}>
                <SelectTrigger className={errors.deliveryStatus ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select delivery status" />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERY_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.deliveryStatus && <p className="text-sm text-destructive mt-1">{errors.deliveryStatus}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={currentStep === 1 ? onCancel : handlePrevious} disabled={isLoading}>
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </Button>

        {currentStep < 3 ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : isEditMode ? 'Update Repair Order' : 'Create Repair Order'}
          </Button>
        )}
      </div>
    </div>
  );
}
