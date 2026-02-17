import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StepIndicator from '@/components/StepIndicator';
import { usePlaceOrder } from './usePlaceOrder';
import { useUpdateOrder } from './useUpdateOrder';
import { useGetOrder } from './useGetOrder';
import { initialFormData, MATERIALS, ORDER_TYPES, ORDER_STATUSES, type OrderFormData, getWeightFieldsEnabled } from './orderTypes';
import { formatWeight } from '@/lib/formatters';
import { ChevronRight, ChevronLeft, Save, AlertCircle, Loader2 } from 'lucide-react';

interface OrderWizardProps {
  onOrderSaved: (billNo: number, isUpdate?: boolean) => void;
  editingBillNo?: number | null;
}

export default function OrderWizard({ onOrderSaved, editingBillNo }: OrderWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OrderFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof OrderFormData, string>>>({});
  const [saveError, setSaveError] = useState<string>('');
  
  const { mutate: placeOrder, isPending: isPlacing } = usePlaceOrder();
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder();
  const { data: existingOrder, isLoading: isLoadingOrder, error: loadError } = useGetOrder(editingBillNo || null);

  const isEditMode = !!editingBillNo;
  const isPending = isPlacing || isUpdating;

  const stepLabels = ['Basic Details', 'Weight', 'Amount', 'Delivery & Status'];

  // Load existing order data when editing
  useEffect(() => {
    if (isEditMode && existingOrder) {
      setFormData({
        orderDate: new Date().toISOString().split('T')[0], // Keep current date
        billNo: String(existingOrder.billNo),
        customerName: existingOrder.customerName,
        phoneNo: existingOrder.deliveryContact,
        material: existingOrder.material as any,
        item: existingOrder.materialDescription,
        orderType: existingOrder.orderType as any,
        exchangeWt: formatWeight(existingOrder.netWeight),
        deductWt: formatWeight(existingOrder.cutWeight),
        addedWt: formatWeight(existingOrder.grossWeight),
        totalWt: '0', // Will be auto-calculated
        ratePerGm: '0',
        materialCost: '0',
        makingCharge: '0',
        otherCharge: '0',
        totalCost: '0',
        deliveryDate: existingOrder.deliveryAddress,
        assignTo: existingOrder.pickupLocation,
        status: 'Pending',
        remarks: existingOrder.palletType
      });
    }
  }, [isEditMode, existingOrder]);

  // Check if material is "Other"
  const isMaterialOther = formData.material === 'Other';

  // Get enabled state for weight fields based on order type
  const weightFieldsEnabled = getWeightFieldsEnabled(formData.orderType);

  // Override weight fields enabled state when material is "Other"
  const effectiveWeightFieldsEnabled = {
    exchangeWt: !isMaterialOther && weightFieldsEnabled.exchangeWt,
    deductWt: !isMaterialOther && weightFieldsEnabled.deductWt,
    addedWt: !isMaterialOther && weightFieldsEnabled.addedWt,
  };

  // Clear Order Type when Material is "Other"
  useEffect(() => {
    if (formData.material === 'Other') {
      setFormData(prev => ({ ...prev, orderType: '' }));
      setErrors(prev => ({ ...prev, orderType: undefined }));
    }
  }, [formData.material]);

  // Auto-zero weight fields when material becomes "Other"
  useEffect(() => {
    if (isMaterialOther) {
      setFormData(prev => ({
        ...prev,
        exchangeWt: '0',
        deductWt: '0',
        addedWt: '0',
      }));
    }
  }, [isMaterialOther]);

  // Auto-zero disabled weight fields when order type changes
  useEffect(() => {
    setFormData(prev => {
      const updates: Partial<OrderFormData> = {};
      
      if (!effectiveWeightFieldsEnabled.exchangeWt && prev.exchangeWt !== '0') {
        updates.exchangeWt = '0';
      }
      if (!effectiveWeightFieldsEnabled.deductWt && prev.deductWt !== '0') {
        updates.deductWt = '0';
      }
      if (!effectiveWeightFieldsEnabled.addedWt && prev.addedWt !== '0') {
        updates.addedWt = '0';
      }
      
      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        return { ...prev, ...updates };
      }
      return prev;
    });
  }, [effectiveWeightFieldsEnabled.exchangeWt, effectiveWeightFieldsEnabled.deductWt, effectiveWeightFieldsEnabled.addedWt]);

  // Auto-zero rate and material cost when material becomes "Other"
  useEffect(() => {
    if (isMaterialOther) {
      setFormData(prev => ({
        ...prev,
        ratePerGm: '0',
        materialCost: '0',
      }));
    }
  }, [isMaterialOther]);

  // Auto-calculate Total Weight
  useEffect(() => {
    const exchange = parseFloat(formData.exchangeWt) || 0;
    const deduct = parseFloat(formData.deductWt) || 0;
    const added = parseFloat(formData.addedWt) || 0;
    const total = exchange - deduct + added;
    setFormData(prev => ({ ...prev, totalWt: total.toFixed(2) }));
  }, [formData.exchangeWt, formData.deductWt, formData.addedWt]);

  // Auto-calculate Material Cost from Rate/gm × Added Wt
  useEffect(() => {
    const ratePerGm = parseFloat(formData.ratePerGm) || 0;
    const addedWt = parseFloat(formData.addedWt) || 0;
    const materialCost = ratePerGm * addedWt;
    setFormData(prev => ({ ...prev, materialCost: materialCost.toFixed(2) }));
  }, [formData.ratePerGm, formData.addedWt]);

  // Auto-calculate Total Cost
  useEffect(() => {
    const materialCost = parseFloat(formData.materialCost) || 0;
    const makingCharge = parseFloat(formData.makingCharge) || 0;
    const otherCharge = parseFloat(formData.otherCharge) || 0;
    const total = materialCost + makingCharge + otherCharge;
    setFormData(prev => ({ ...prev, totalCost: total.toFixed(2) }));
  }, [formData.materialCost, formData.makingCharge, formData.otherCharge]);

  const handleInputChange = (field: keyof OrderFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Clear save error when user makes changes
    if (saveError) {
      setSaveError('');
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof OrderFormData, string>> = {};
    
    // Material is required
    if (!formData.material) {
      newErrors.material = 'Material is required';
    }
    
    // Order Type is required only when Material is not "Other"
    if (formData.material !== 'Other' && !formData.orderType) {
      newErrors.orderType = 'Order type is required';
    }
    
    // Phone number is optional, but if provided must be valid
    if (formData.phoneNo.trim() && !/^[\d\s\-\+\(\)]+$/.test(formData.phoneNo)) {
      newErrors.phoneNo = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateNumericField = (value: string, fieldName: string): boolean => {
    const trimmed = value.trim();
    // Empty or just a dash is treated as 0, which is valid
    if (trimmed === '' || trimmed === '-') {
      return true;
    }
    const num = parseFloat(trimmed);
    if (isNaN(num) || !isFinite(num)) {
      return false;
    }
    return true;
  };

  const validateStep4BeforeSave = (): boolean => {
    const newErrors: Partial<Record<keyof OrderFormData, string>> = {};
    
    // Validate all numeric fields that will be sent to backend
    const numericFields: Array<{ key: keyof OrderFormData; label: string }> = [
      { key: 'exchangeWt', label: 'Exchange Weight' },
      { key: 'deductWt', label: 'Deduct Weight' },
      { key: 'addedWt', label: 'Added Weight' },
      { key: 'totalWt', label: 'Total Weight' },
      { key: 'ratePerGm', label: 'Rate per gram' },
      { key: 'materialCost', label: 'Material Cost' },
      { key: 'makingCharge', label: 'Making Charge' },
      { key: 'otherCharge', label: 'Other Charge' },
      { key: 'totalCost', label: 'Total Cost' }
    ];

    for (const field of numericFields) {
      if (!validateNumericField(formData[field.key], field.label)) {
        newErrors[field.key] = `${field.label} must be a valid number`;
      }
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setSaveError('Please fix the validation errors before saving.');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) {
        return;
      }
    }
    
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      // Clear save error when navigating back
      setSaveError('');
    }
  };

  const handleSave = () => {
    // Clear any previous save error
    setSaveError('');
    
    // Validate numeric fields before attempting to save
    if (!validateStep4BeforeSave()) {
      return;
    }

    if (isEditMode && editingBillNo) {
      // Update existing order
      updateOrder(
        { billNo: editingBillNo, formData },
        {
          onSuccess: () => {
            onOrderSaved(editingBillNo, true);
          },
          onError: (error: Error) => {
            setSaveError(error.message || 'Failed to update order. Please try again.');
          }
        }
      );
    } else {
      // Create new order
      placeOrder(formData, {
        onSuccess: (billNo) => {
          onOrderSaved(billNo, false);
        },
        onError: (error: Error) => {
          setSaveError(error.message || 'Failed to save order. Please try again.');
        }
      });
    }
  };

  const isOrderTypeDisabled = formData.material === 'Other';

  // Show loading state while fetching order data
  if (isEditMode && isLoadingOrder) {
    return (
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="text-center">Loading Order...</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Show error if order failed to load
  if (isEditMode && loadError) {
    return (
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="text-center">Error Loading Order</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {loadError instanceof Error ? loadError.message : 'Failed to load order. Please try again.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="text-center">{isEditMode ? 'Edit Order' : 'New Order'}</CardTitle>
        <StepIndicator currentStep={currentStep} totalSteps={4} stepLabels={stepLabels} />
      </CardHeader>
      <CardContent>
        {/* Step 1: Basic Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderDate">Date</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => handleInputChange('orderDate', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="billNo">Bill No.</Label>
                <Input
                  id="billNo"
                  value={formData.billNo}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Enter customer name"
                className={errors.customerName ? 'border-destructive' : ''}
              />
              {errors.customerName && (
                <p className="text-sm text-destructive">{errors.customerName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNo">Phone Number</Label>
              <Input
                id="phoneNo"
                value={formData.phoneNo}
                onChange={(e) => handleInputChange('phoneNo', e.target.value)}
                placeholder="Enter phone number"
                className={errors.phoneNo ? 'border-destructive' : ''}
              />
              {errors.phoneNo && (
                <p className="text-sm text-destructive">{errors.phoneNo}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material">Material *</Label>
                <Select
                  value={formData.material}
                  onValueChange={(value) => handleInputChange('material', value)}
                >
                  <SelectTrigger className={errors.material ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIALS.map((material) => (
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

              <div className="space-y-2">
                <Label htmlFor="item">Item</Label>
                <Input
                  id="item"
                  value={formData.item}
                  onChange={(e) => handleInputChange('item', e.target.value)}
                  placeholder="e.g., Ring, Necklace"
                  className={errors.item ? 'border-destructive' : ''}
                />
                {errors.item && (
                  <p className="text-sm text-destructive">{errors.item}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderType" className={isOrderTypeDisabled ? 'text-muted-foreground' : ''}>
                Order Type {!isOrderTypeDisabled && '*'}
              </Label>
              <Select
                value={formData.orderType}
                onValueChange={(value) => handleInputChange('orderType', value)}
                disabled={isOrderTypeDisabled}
              >
                <SelectTrigger 
                  className={`${errors.orderType ? 'border-destructive' : ''} ${isOrderTypeDisabled ? 'bg-muted cursor-not-allowed opacity-60' : ''}`}
                  disabled={isOrderTypeDisabled}
                >
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.orderType && (
                <p className="text-sm text-destructive">{errors.orderType}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Weight */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exchangeWt" className={!effectiveWeightFieldsEnabled.exchangeWt ? 'text-muted-foreground' : ''}>
                  Exchange Wt. (gm)
                </Label>
                <Input
                  id="exchangeWt"
                  type="number"
                  step="0.01"
                  value={formData.exchangeWt}
                  onChange={(e) => handleInputChange('exchangeWt', e.target.value)}
                  placeholder="0.00"
                  disabled={!effectiveWeightFieldsEnabled.exchangeWt}
                  className={!effectiveWeightFieldsEnabled.exchangeWt ? 'bg-muted cursor-not-allowed opacity-60' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deductWt" className={!effectiveWeightFieldsEnabled.deductWt ? 'text-muted-foreground' : ''}>
                  Deduct Wt. (gm)
                </Label>
                <Input
                  id="deductWt"
                  type="number"
                  step="0.01"
                  value={formData.deductWt}
                  onChange={(e) => handleInputChange('deductWt', e.target.value)}
                  placeholder="0.00"
                  disabled={!effectiveWeightFieldsEnabled.deductWt}
                  className={!effectiveWeightFieldsEnabled.deductWt ? 'bg-muted cursor-not-allowed opacity-60' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addedWt" className={!effectiveWeightFieldsEnabled.addedWt ? 'text-muted-foreground' : ''}>
                  Added Wt. (gm)
                </Label>
                <Input
                  id="addedWt"
                  type="number"
                  step="0.01"
                  value={formData.addedWt}
                  onChange={(e) => handleInputChange('addedWt', e.target.value)}
                  placeholder="0.00"
                  disabled={!effectiveWeightFieldsEnabled.addedWt}
                  className={!effectiveWeightFieldsEnabled.addedWt ? 'bg-muted cursor-not-allowed opacity-60' : ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalWt">Total Wt. (gm)</Label>
              <Input
                id="totalWt"
                value={formData.totalWt}
                disabled
                className="bg-muted font-semibold text-lg"
              />
            </div>
          </div>
        )}

        {/* Step 3: Amount */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ratePerGm" className={isMaterialOther ? 'text-muted-foreground' : ''}>
                  Rate/gm (₹)
                </Label>
                <Input
                  id="ratePerGm"
                  type="number"
                  step="0.01"
                  value={formData.ratePerGm}
                  onChange={(e) => handleInputChange('ratePerGm', e.target.value)}
                  placeholder="0.00"
                  disabled={isMaterialOther}
                  className={isMaterialOther ? 'bg-muted cursor-not-allowed opacity-60' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="materialCost" className={isMaterialOther ? 'text-muted-foreground' : ''}>
                  Material Cost (₹)
                </Label>
                <Input
                  id="materialCost"
                  value={formData.materialCost}
                  disabled
                  className={`bg-muted font-semibold ${isMaterialOther ? 'opacity-60' : ''}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="makingCharge">Making Charge (₹)</Label>
                <Input
                  id="makingCharge"
                  type="number"
                  step="0.01"
                  value={formData.makingCharge}
                  onChange={(e) => handleInputChange('makingCharge', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherCharge">Other Charge (₹)</Label>
                <Input
                  id="otherCharge"
                  type="number"
                  step="0.01"
                  value={formData.otherCharge}
                  onChange={(e) => handleInputChange('otherCharge', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalCost">Total Cost (₹)</Label>
              <Input
                id="totalCost"
                value={formData.totalCost}
                disabled
                className="bg-muted font-semibold text-lg"
              />
            </div>
          </div>
        )}

        {/* Step 4: Delivery & Status */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Delivery Date</Label>
              <Input
                id="deliveryDate"
                value={formData.deliveryDate}
                onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                placeholder="Enter delivery date or address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignTo">Assign To</Label>
              <Input
                id="assignTo"
                value={formData.assignTo}
                onChange={(e) => handleInputChange('assignTo', e.target.value)}
                placeholder="Enter person or location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                placeholder="Enter any additional notes"
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {saveError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isPending}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button onClick={handleNext} disabled={isPending}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditMode ? 'Update Order' : 'Save Order'}
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
