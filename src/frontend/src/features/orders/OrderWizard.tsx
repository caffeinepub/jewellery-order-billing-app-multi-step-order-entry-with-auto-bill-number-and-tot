import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import StepIndicator from '../../components/StepIndicator';
import { usePlaceOrder } from './usePlaceOrder';
import { useUpdateOrder } from './useUpdateOrder';
import { useGetOrder } from './useGetOrder';
import { useListEmployees } from '../employees/useListEmployees';
import { MATERIALS, ORDER_TYPES, OrderFormData, initialFormData, getWeightFieldsEnabled } from './orderTypes';
import { toast } from 'sonner';

interface OrderWizardProps {
  onCancel: () => void;
  onSuccess: (billNo: bigint) => void;
  editBillNo?: number | null;
}

export default function OrderWizard({ onCancel, onSuccess, editBillNo }: OrderWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OrderFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof OrderFormData, string>>>({});

  const isEditMode = editBillNo !== null && editBillNo !== undefined;
  const { data: existingOrder, isLoading: isLoadingOrder } = useGetOrder(editBillNo || 0);
  const { data: employees = [], isLoading: isLoadingEmployees } = useListEmployees();

  const placeOrderMutation = usePlaceOrder();
  const updateOrderMutation = useUpdateOrder();

  useEffect(() => {
    if (isEditMode && existingOrder) {
      const deliveryDateValue = existingOrder.deliveryDate && Number(existingOrder.deliveryDate) > 0
        ? new Date(Number(existingOrder.deliveryDate) / 1_000_000).toISOString().split('T')[0]
        : '';

      setFormData({
        orderDate: new Date().toISOString().split('T')[0],
        billNo: String(existingOrder.billNo),
        customerName: existingOrder.customerName,
        phoneNo: existingOrder.deliveryContact,
        material: existingOrder.material as '' | 'Gold' | 'Silver' | 'Other',
        item: existingOrder.materialDescription,
        orderType: existingOrder.orderType as '' | 'New Order' | 'Exchange Order' | 'New Readymade' | 'Exchange Readymade',
        exchangeWt: (Number(existingOrder.netWeight)).toFixed(2),
        deductWt: (Number(existingOrder.cutWeight)).toFixed(2),
        addedWt: (Number(existingOrder.grossWeight)).toFixed(2),
        totalWt: '0',
        ratePerGm: '0',
        materialCost: '0',
        makingCharge: '0',
        otherCharge: '0',
        totalCost: '0',
        deliveryDate: deliveryDateValue,
        assignedTo: existingOrder.assignedTo ? String(existingOrder.assignedTo) : '',
        status: existingOrder.pickupLocation || 'Pending',
        remarks: existingOrder.palletType,
      });
    }
  }, [isEditMode, existingOrder]);

  const isMaterialOther = formData.material === 'Other';
  const weightFieldsEnabled = getWeightFieldsEnabled(formData.orderType);
  const effectiveWeightFieldsEnabled = {
    exchangeWt: !isMaterialOther && weightFieldsEnabled.exchangeWt,
    deductWt: !isMaterialOther && weightFieldsEnabled.deductWt,
    addedWt: !isMaterialOther && weightFieldsEnabled.addedWt,
  };

  useEffect(() => {
    if (formData.material === 'Other') {
      setFormData(prev => ({ ...prev, orderType: '' }));
      setErrors(prev => ({ ...prev, orderType: undefined }));
    }
  }, [formData.material]);

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
      
      if (Object.keys(updates).length > 0) {
        return { ...prev, ...updates };
      }
      return prev;
    });
  }, [effectiveWeightFieldsEnabled.exchangeWt, effectiveWeightFieldsEnabled.deductWt, effectiveWeightFieldsEnabled.addedWt]);

  useEffect(() => {
    if (isMaterialOther) {
      setFormData(prev => ({
        ...prev,
        ratePerGm: '0',
        materialCost: '0',
      }));
    }
  }, [isMaterialOther]);

  useEffect(() => {
    const exchange = parseFloat(formData.exchangeWt) || 0;
    const deduct = parseFloat(formData.deductWt) || 0;
    const added = parseFloat(formData.addedWt) || 0;
    const total = exchange - deduct + added;
    setFormData(prev => ({ ...prev, totalWt: total.toFixed(2) }));
  }, [formData.exchangeWt, formData.deductWt, formData.addedWt]);

  useEffect(() => {
    const ratePerGm = parseFloat(formData.ratePerGm) || 0;
    const addedWt = parseFloat(formData.addedWt) || 0;
    const materialCost = ratePerGm * addedWt;
    setFormData(prev => ({ ...prev, materialCost: materialCost.toFixed(2) }));
  }, [formData.ratePerGm, formData.addedWt]);

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
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof OrderFormData, string>> = {};

    if (step === 1) {
      if (!formData.material) newErrors.material = 'Material is required';
      if (formData.material !== 'Other' && !formData.orderType) {
        newErrors.orderType = 'Order type is required';
      }
      if (formData.phoneNo.trim() && !/^[\d\s\-\+\(\)]+$/.test(formData.phoneNo)) {
        newErrors.phoneNo = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      console.log('Submitting order form:', formData);

      if (isEditMode && editBillNo) {
        console.log('Updating order:', editBillNo);
        await updateOrderMutation.mutateAsync({
          billNo: BigInt(editBillNo),
          customerName: formData.customerName,
          orderType: formData.orderType,
          material: formData.material,
          materialDescription: formData.item,
          palletType: formData.remarks,
          pickupLocation: formData.status,
          deliveryAddress: formData.assignedTo || '',
          deliveryContact: formData.phoneNo,
          netWeight: formData.exchangeWt,
          grossWeight: formData.addedWt,
          cutWeight: formData.deductWt,
          deliveryDate: formData.deliveryDate,
          assignedTo: formData.assignedTo || '',
        });
        toast.success('Order updated successfully!');
        onSuccess(BigInt(editBillNo));
      } else {
        console.log('Creating new order');
        const billNo = await placeOrderMutation.mutateAsync({
          customerName: formData.customerName,
          orderType: formData.orderType,
          material: formData.material,
          materialDescription: formData.item,
          palletType: formData.remarks,
          pickupLocation: formData.status,
          deliveryAddress: formData.assignedTo || '',
          deliveryContact: formData.phoneNo,
          netWeight: formData.exchangeWt,
          grossWeight: formData.addedWt,
          cutWeight: formData.deductWt,
          assignedTo: formData.assignedTo || '',
        });
        toast.success('Order created successfully!');
        onSuccess(billNo);
      }
    } catch (error: any) {
      console.error('Error submitting order:', error);
      const errorMessage = error?.message || 'Failed to save order';
      toast.error(errorMessage);
    }
  };

  const isLoading = placeOrderMutation.isPending || updateOrderMutation.isPending;

  if (isEditMode && isLoadingOrder) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order...</p>
        </div>
      </div>
    );
  }

  const stepLabels = ['Basic Details', 'Weight', 'Amount', 'Delivery & Status'];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">{isEditMode ? 'Edit Order' : 'Create New Order'}</h2>
        <StepIndicator currentStep={currentStep} totalSteps={4} stepLabels={stepLabels} />
      </div>

      <div className="space-y-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orderDate">Order Date</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => handleInputChange('orderDate', e.target.value)}
                />
              </div>
              <div>
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
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="phoneNo">Phone No.</Label>
                <Input
                  id="phoneNo"
                  value={formData.phoneNo}
                  onChange={(e) => handleInputChange('phoneNo', e.target.value)}
                  placeholder="Enter phone number"
                />
                {errors.phoneNo && (
                  <p className="text-sm text-destructive mt-1">{errors.phoneNo}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="material">Material *</Label>
                <Select value={formData.material} onValueChange={(value) => handleInputChange('material', value)}>
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
                {errors.material && <p className="text-sm text-destructive mt-1">{errors.material}</p>}
              </div>
              <div>
                <Label htmlFor="item">Item</Label>
                <Input
                  id="item"
                  value={formData.item}
                  onChange={(e) => handleInputChange('item', e.target.value)}
                  placeholder="Enter item description"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="orderType">Order Type {formData.material !== 'Other' && '*'}</Label>
              <Select
                value={formData.orderType}
                onValueChange={(value) => handleInputChange('orderType', value)}
                disabled={formData.material === 'Other'}
              >
                <SelectTrigger className={errors.orderType ? 'border-destructive' : ''}>
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
              {errors.orderType && <p className="text-sm text-destructive mt-1">{errors.orderType}</p>}
              {formData.material === 'Other' && (
                <p className="text-sm text-muted-foreground mt-1">
                  Order type is not applicable for "Other" material
                </p>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
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
              <div>
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
              <div>
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
              <div>
                <Label htmlFor="totalWt">Total Wt. (gm)</Label>
                <Input
                  id="totalWt"
                  value={formData.totalWt}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ratePerGm">Rate per Gram (₹)</Label>
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
              <div>
                <Label htmlFor="materialCost">Material Cost (₹)</Label>
                <Input
                  id="materialCost"
                  value={formData.materialCost}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="makingCharge">Making Charge (₹)</Label>
                <Input
                  id="makingCharge"
                  type="number"
                  step="0.01"
                  value={formData.makingCharge}
                  onChange={(e) => handleInputChange('makingCharge', e.target.value)}
                />
              </div>
              <div>
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

            <div>
              <Label htmlFor="totalCost">Total Cost (₹)</Label>
              <Input
                id="totalCost"
                value={formData.totalCost}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        )}

        {currentStep === 4 && (
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
                    <SelectItem key={String(employee.id)} value={String(employee.id)}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                placeholder="Enter status"
              />
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
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
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={currentStep === 1 ? onCancel : handlePrevious} disabled={isLoading}>
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </Button>

        {currentStep < 4 ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : isEditMode ? 'Update Order' : 'Create Order'}
          </Button>
        )}
      </div>
    </div>
  );
}
