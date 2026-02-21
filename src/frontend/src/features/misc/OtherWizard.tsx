import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StepIndicator from '@/components/StepIndicator';
import { usePlaceOtherService } from './usePlaceOtherService';
import { initialOtherFormData, type OtherFormData } from './otherTypes';
import { ChevronRight, ChevronLeft, Save, AlertCircle, Loader2 } from 'lucide-react';

interface OtherWizardProps {
  onServiceSaved: (serviceId: number) => void;
}

export default function OtherWizard({ onServiceSaved }: OtherWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OtherFormData>(initialOtherFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof OtherFormData, string>>>({});
  const [saveError, setSaveError] = useState<string>('');
  
  const { mutate: placeService, isPending } = usePlaceOtherService();

  const stepLabels = ['Contact Details', 'Amount & Remarks'];

  const handleInputChange = (field: keyof OtherFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (saveError) {
      setSaveError('');
    }
  };

  const validateNumericField = (value: string): boolean => {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === '-') {
      return false;
    }
    const num = parseFloat(trimmed);
    if (isNaN(num) || !isFinite(num)) {
      return false;
    }
    return true;
  };

  const validateStep2BeforeSave = (): boolean => {
    const newErrors: Partial<Record<keyof OtherFormData, string>> = {};
    
    if (!validateNumericField(formData.amount)) {
      newErrors.amount = 'Amount is required and must be a valid number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    if (!validateStep2BeforeSave()) {
      return;
    }

    placeService(formData, {
      onSuccess: (serviceId) => {
        onServiceSaved(serviceId);
      },
      onError: (error: Error) => {
        setSaveError(error.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={currentStep} totalSteps={2} stepLabels={stepLabels} />

      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>New Other Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Contact Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone No (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          )}

          {/* Step 2: Amount & Remarks */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="Enter amount"
                  className={errors.amount ? 'border-destructive' : ''}
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks (optional)</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  placeholder="Enter any additional remarks"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {saveError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isPending}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < 2 ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSave} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Service
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
