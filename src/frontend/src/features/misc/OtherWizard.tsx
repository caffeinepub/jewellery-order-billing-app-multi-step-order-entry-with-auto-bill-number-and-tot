import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import StepIndicator from '../../components/StepIndicator';
import { usePlaceOtherService } from './usePlaceOtherService';
import { OtherFormData, initialOtherFormData } from './otherTypes';
import { toast } from 'sonner';

interface OtherWizardProps {
  onCancel: () => void;
  onSuccess: (serviceId: bigint) => void;
}

export default function OtherWizard({ onCancel, onSuccess }: OtherWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OtherFormData>(initialOtherFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof OtherFormData, string>>>({});

  const placeOtherServiceMutation = usePlaceOtherService();

  const handleInputChange = (field: keyof OtherFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof OtherFormData, string>> = {};

    if (step === 2) {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.amount = 'Valid amount is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 2));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    try {
      console.log('Submitting other service form:', formData);
      const serviceId = await placeOtherServiceMutation.mutateAsync(formData);
      toast.success('Other service created successfully!');
      onSuccess(serviceId);
    } catch (error: any) {
      console.error('Error submitting other service:', error);
      const errorMessage = error?.message || 'Failed to save other service';
      toast.error(errorMessage);
    }
  };

  const isLoading = placeOtherServiceMutation.isPending;
  const stepLabels = ['Contact Details', 'Amount & Remarks'];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Create Other Service</h2>
        <StepIndicator currentStep={currentStep} totalSteps={2} stepLabels={stepLabels} />
      </div>

      <div className="space-y-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className={errors.amount ? 'border-destructive' : ''}
              />
              {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount}</p>}
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                rows={4}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={currentStep === 1 ? onCancel : handlePrevious} disabled={isLoading}>
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </Button>

        {currentStep < 2 ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Create Service'}
          </Button>
        )}
      </div>
    </div>
  );
}
