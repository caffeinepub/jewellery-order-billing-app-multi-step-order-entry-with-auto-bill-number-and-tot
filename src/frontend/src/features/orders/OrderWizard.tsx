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
      // Convert deliveryDate from nanoseconds to date string
      let deliveryDateStr = '';
      if (existingOrder.deliveryDate && Number(existingOrder.deliveryDate) > 0) {
        const deliveryDate = new Date(Number(existingOrder.deliveryDate) / 1000000);
        deliveryDateStr = deliveryDate.toISOString().split('T')[0];
      }

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
        deliveryDate: deliveryDateStr,
        assignTo: existingOrder.deliveryAddress,
        status: existingOrder.pickupLocation || 'Pending',
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
    const numericFields: Array<keyof OrderFormData> = [
      'exchangeWt', 'deductWt', 'addedWt', 'totalWt',
      'ratePerGm', 'materialCost', 'makingCharge', 'otherCharge', 'totalCost'
    ];
    
    for (const field of numericFields) {
      if (!validateNumericField(formData[field], field)) {
        newErrors[field] = `Invalid number format`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    if (!validateStep4BeforeSave()) {
      return;
    }

    if (isEditMode && editingBillNo) {
      updateOrder(
        { billNo: editingBillNo, formData },
        {
          onSuccess: () => {
            onOrderSaved(editingBillNo, true);
          },
          onError: (error: Error) => {
            setSaveError(error.message);
          }
        }
      );
    } else {
      placeOrder(formData, {
        onSuccess: (billNo) => {
          onOrderSaved(billNo, false);
        },
        onError: (error: Error) => {
          setSaveError(error.message);
        }
      });
    }
  };

  if (isLoadingOrder) {
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
          {loadError instanceof Error ? loadError.message : 'Failed to load order'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={currentStep} totalSteps={4} stepLabels={stepLabels} />

      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>
            {isEditMode ? `Edit Order #${editingBillNo}` : 'New Order'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderDate">Order Date</Label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNo">Phone No.</Label>
                  <Input
                    id="phoneNo"
                    value={formData.phoneNo}
                    onChange={(e) => handleInputChange('phoneNo', e.target.value)}
                    placeholder="Enter phone number"
                  />
                  {errors.phoneNo && (
                    <p className="text-sm text-destructive">{errors.phoneNo}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="Enter item description"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderType">Order Type {formData.material !== 'Other' && '*'}</Label>
                <Select
                  value={formData.orderType}
                  onValueChange={(value) => handleInputChange('orderType', value)}
                  disabled={formData.material === 'Other'}
                >
                  <SelectTrigger 
                    id="orderType" 
                    className={errors.orderType ? 'border-destructive' : ''}
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
                {formData.material === 'Other' && (
                  <p className="text-sm text-muted-foreground">
                    Order type is not applicable for "Other" material
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Weight */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exchangeWt">Exchange Wt. (gm)</Label>
                  <Input
                    id="exchangeWt"
                    type="number"
                    step="0.01"
                    value={formData.exchangeWt}
                    onChange={(e) => handleInputChange('exchangeWt', e.target.value)}
                    disabled={!effectiveWeightFieldsEnabled.exchangeWt}
                    className={!effectiveWeightFieldsEnabled.exchangeWt ? 'bg-muted' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deductWt">Deduct Wt. (gm)</Label>
                  <Input
                    id="deductWt"
                    type="number"
                    step="0.01"
                    value={formData.deductWt}
                    onChange={(e) => handleInputChange('deductWt', e.target.value)}
                    disabled={!effectiveWeightFieldsEnabled.deductWt}
                    className={!effectiveWeightFieldsEnabled.deductWt ? 'bg-muted' : ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addedWt">Added Wt. (gm)</Label>
                  <Input
                    id="addedWt"
                    type="number"
                    step="0.01"
                    value={formData.addedWt}
                    onChange={(e) => handleInputChange('addedWt', e.target.value)}
                    disabled={!effectiveWeightFieldsEnabled.addedWt}
                    className={!effectiveWeightFieldsEnabled.addedWt ? 'bg-muted' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalWt">Total Wt. (gm)</Label>
                  <Input
                    id="totalWt"
                    value={formData.totalWt}
                    disabled
                    className="bg-muted font-semibold"
                  />
                </div>
              </div>

              {isMaterialOther && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Weight fields are disabled for "Other" material type
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 3: Amount */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ratePerGm">Rate/gm (₹)</Label>
                  <Input
                    id="ratePerGm"
                    type="number"
                    step="0.01"
                    value={formData.ratePerGm}
                    onChange={(e) => handleInputChange('ratePerGm', e.target.value)}
                    disabled={isMaterialOther}
                    className={isMaterialOther ? 'bg-muted' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="materialCost">Material Cost (₹)</Label>
                  <Input
                    id="materialCost"
                    value={formData.materialCost}
                    disabled
                    className="bg-muted font-semibold"
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

              {isMaterialOther && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Rate and material cost are disabled for "Other" material type
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 4: Delivery & Status */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="assignTo">Assign To</Label>
                  <Input
                    id="assignTo"
                    value={formData.assignTo}
                    onChange={(e) => handleInputChange('assignTo', e.target.value)}
                    placeholder="Enter assignee name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger id="status">
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
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isPending}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNext}>
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
    </div>
  );
}
