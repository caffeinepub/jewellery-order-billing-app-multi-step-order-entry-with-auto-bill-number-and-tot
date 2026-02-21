import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import StepIndicator from '../../components/StepIndicator';
import { usePlacePiercingService } from './usePlacePiercingService';
import { PiercingFormData, initialPiercingFormData } from './piercingTypes';
import { toast } from 'sonner';

interface PiercingWizardProps {
  onCancel: () => void;
  onSuccess: (serviceId: bigint) => void;
}

export default function PiercingWizard({ onCancel, onSuccess }: PiercingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PiercingFormData>(initialPiercingFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof PiercingFormData, string>>>({});

  const placePiercingServiceMutation = usePlacePiercingService();

  const handleInputChange = (field: keyof PiercingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof PiercingFormData, string>> = {};

    if (step === 1) {
      if (!formData.date) newErrors.date = 'Date is required';
    }

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
      console.log('Submitting piercing service form:', formData);
      const serviceId = await placePiercingServiceMutation.mutateAsync(formData);
      toast.success('Piercing service created successfully!');
      onSuccess(serviceId);
    } catch (error: any) {
      console.error('Error submitting piercing service:', error);
      const errorMessage = error?.message || 'Failed to save piercing service';
      toast.error(errorMessage);
    }
  };

  const isLoading = placePiercingServiceMutation.isPending;
  const stepLabels = ['Basic Details', 'Amount & Remarks'];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Create Piercing Service</h2>
        <StepIndicator currentStep={currentStep} totalSteps={2} stepLabels={stepLabels} />
      </div>

      <div className="space-y-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={errors.date ? 'border-destructive' : ''}
              />
              {errors.date && <p className="text-sm text-destructive mt-1">{errors.date}</p>}
            </div>

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
