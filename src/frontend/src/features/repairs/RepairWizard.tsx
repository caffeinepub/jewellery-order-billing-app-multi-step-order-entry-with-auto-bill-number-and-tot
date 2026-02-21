import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StepIndicator from '@/components/StepIndicator';
import { usePlaceRepairOrder } from './usePlaceRepairOrder';
import { useUpdateRepairOrder } from './useUpdateRepairOrder';
import { useGetRepairOrder } from './useGetRepairOrder';
import { 
  initialRepairFormData, 
  REPAIR_MATERIALS, 
  REPAIR_STATUSES, 
  DELIVERY_STATUSES,
  type RepairFormData 
} from './repairTypes';
import { ChevronRight, ChevronLeft, Save, AlertCircle, Loader2 } from 'lucide-react';

interface RepairWizardProps {
  onRepairSaved: (repairId: number, isUpdate?: boolean) => void;
  editingRepairId?: number | null;
}

export default function RepairWizard({ onRepairSaved, editingRepairId }: RepairWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RepairFormData>(initialRepairFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof RepairFormData, string>>>({});
  const [saveError, setSaveError] = useState<string>('');
  
  const { mutate: placeRepair, isPending: isPlacing } = usePlaceRepairOrder();
  const { mutate: updateRepair, isPending: isUpdating } = useUpdateRepairOrder();
  const { data: existingRepair, isLoading: isLoadingRepair, error: loadError } = useGetRepairOrder(editingRepairId || null);

  const isEditMode = !!editingRepairId;
  const isPending = isPlacing || isUpdating;

  const stepLabels = ['Basic Details', 'Costs', 'Delivery & Status'];

  // Load existing repair data when editing
  useEffect(() => {
    if (isEditMode && existingRepair) {
      // Convert dates from nanoseconds to date string
      let dateStr = '';
      if (existingRepair.date && Number(existingRepair.date) > 0) {
        const date = new Date(Number(existingRepair.date) / 1000000);
        dateStr = date.toISOString().split('T')[0];
      }

      let deliveryDateStr = '';
      if (existingRepair.deliveryDate && Number(existingRepair.deliveryDate) > 0) {
        const deliveryDate = new Date(Number(existingRepair.deliveryDate) / 1000000);
        deliveryDateStr = deliveryDate.toISOString().split('T')[0];
      }

      setFormData({
        date: dateStr,
        material: existingRepair.material as any,
        addedMaterialWeight: (Number(existingRepair.addedMaterialWeight) / 100).toFixed(2),
        materialCost: (Number(existingRepair.materialCost) / 100).toFixed(2),
        makingCharge: (Number(existingRepair.makingCharge) / 100).toFixed(2),
        totalCost: (Number(existingRepair.totalCost) / 100).toFixed(2),
        deliveryDate: deliveryDateStr,
        assignTo: existingRepair.assignTo,
        status: existingRepair.status as any,
        deliveryStatus: existingRepair.deliveryStatus as any
      });
    }
  }, [isEditMode, existingRepair]);

  // Auto-calculate Total Cost
  useEffect(() => {
    const materialCost = parseFloat(formData.materialCost) || 0;
    const makingCharge = parseFloat(formData.makingCharge) || 0;
    const total = materialCost + makingCharge;
    setFormData(prev => ({ ...prev, totalCost: total.toFixed(2) }));
  }, [formData.materialCost, formData.makingCharge]);

  const handleInputChange = (field: keyof RepairFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (saveError) {
      setSaveError('');
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof RepairFormData, string>> = {};
    
    if (!formData.material) {
      newErrors.material = 'Material is required';
    }
    
    if (!formData.assignTo.trim()) {
      newErrors.assignTo = 'Assign to is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateNumericField = (value: string): boolean => {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === '-') {
      return true;
    }
    const num = parseFloat(trimmed);
    if (isNaN(num) || !isFinite(num)) {
      return false;
    }
    return true;
  };

  const validateStep3BeforeSave = (): boolean => {
    const newErrors: Partial<Record<keyof RepairFormData, string>> = {};
    
    const numericFields: Array<keyof RepairFormData> = [
      'addedMaterialWeight', 'materialCost', 'makingCharge', 'totalCost'
    ];
    
    for (const field of numericFields) {
      if (!validateNumericField(formData[field])) {
        newErrors[field] = `Invalid number format`;
      }
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    if (!formData.deliveryStatus) {
      newErrors.deliveryStatus = 'Delivery status is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    if (!validateStep3BeforeSave()) {
      return;
    }

    if (isEditMode && editingRepairId) {
      updateRepair(
        { repairId: editingRepairId, formData },
        {
          onSuccess: () => {
            onRepairSaved(editingRepairId, true);
          },
          onError: (error: Error) => {
            setSaveError(error.message);
          }
        }
      );
    } else {
      placeRepair(formData, {
        onSuccess: (repairId) => {
          onRepairSaved(repairId, false);
        },
        onError: (error: Error) => {
          setSaveError(error.message);
        }
      });
    }
  };

  if (isLoadingRepair) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {loadError instanceof Error ? loadError.message : 'Failed to load repair order'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={currentStep} totalSteps={3} stepLabels={stepLabels} />

      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>
            {isEditMode ? `Edit Repair Order #${editingRepairId}` : 'New Repair Order'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material">Material *</Label>
                  <Select
                    value={formData.material}
                    onValueChange={(value) => handleInputChange('material', value)}
                  >
                    <SelectTrigger id="material" className={errors.material ? 'border-destructive' : ''}>
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
                  {errors.material && (
                    <p className="text-sm text-destructive">{errors.material}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignTo">Assign To *</Label>
                <Input
                  id="assignTo"
                  value={formData.assignTo}
                  onChange={(e) => handleInputChange('assignTo', e.target.value)}
                  placeholder="Enter person or team name"
                  className={errors.assignTo ? 'border-destructive' : ''}
                />
                {errors.assignTo && (
                  <p className="text-sm text-destructive">{errors.assignTo}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Costs */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="addedMaterialWeight">Added Material Weight (gm)</Label>
                <Input
                  id="addedMaterialWeight"
                  type="number"
                  step="0.01"
                  value={formData.addedMaterialWeight}
                  onChange={(e) => handleInputChange('addedMaterialWeight', e.target.value)}
                  placeholder="0.00"
                  className={errors.addedMaterialWeight ? 'border-destructive' : ''}
                />
                {errors.addedMaterialWeight && (
                  <p className="text-sm text-destructive">{errors.addedMaterialWeight}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="materialCost">Material Cost (₹)</Label>
                <Input
                  id="materialCost"
                  type="number"
                  step="0.01"
                  value={formData.materialCost}
                  onChange={(e) => handleInputChange('materialCost', e.target.value)}
                  placeholder="0.00"
                  className={errors.materialCost ? 'border-destructive' : ''}
                />
                {errors.materialCost && (
                  <p className="text-sm text-destructive">{errors.materialCost}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="makingCharge">Making Charge (₹)</Label>
                <Input
                  id="makingCharge"
                  type="number"
                  step="0.01"
                  value={formData.makingCharge}
                  onChange={(e) => handleInputChange('makingCharge', e.target.value)}
                  placeholder="0.00"
                  className={errors.makingCharge ? 'border-destructive' : ''}
                />
                {errors.makingCharge && (
                  <p className="text-sm text-destructive">{errors.makingCharge}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalCost">Total Cost (₹)</Label>
                <Input
                  id="totalCost"
                  type="number"
                  step="0.01"
                  value={formData.totalCost}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Auto-calculated: Material Cost + Making Charge</p>
              </div>
            </div>
          )}

          {/* Step 3: Delivery & Status */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger id="status" className={errors.status ? 'border-destructive' : ''}>
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
                {errors.status && (
                  <p className="text-sm text-destructive">{errors.status}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryStatus">Delivery Status *</Label>
                <Select
                  value={formData.deliveryStatus}
                  onValueChange={(value) => handleInputChange('deliveryStatus', value)}
                >
                  <SelectTrigger id="deliveryStatus" className={errors.deliveryStatus ? 'border-destructive' : ''}>
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
                {errors.deliveryStatus && (
                  <p className="text-sm text-destructive">{errors.deliveryStatus}</p>
                )}
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

            {currentStep < 3 ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSave} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditMode ? 'Update' : 'Save'}
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
