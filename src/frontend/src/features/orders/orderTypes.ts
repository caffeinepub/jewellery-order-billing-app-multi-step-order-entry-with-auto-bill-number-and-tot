export const MATERIALS = ['Gold', 'Silver', 'Other'] as const;
export type Material = typeof MATERIALS[number];

export const ORDER_TYPES = [
  'New Order',
  'Exchange Order',
  'New Readymade',
  'Exchange Readymade'
] as const;
export type OrderType = typeof ORDER_TYPES[number];

export const ORDER_STATUSES = [
  'Pending',
  'On process',
  'Delivered',
  'Cancelled'
] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export interface OrderFormData {
  // Step 1: Basic Details
  orderDate: string;
  billNo: string;
  customerName: string;
  phoneNo: string;
  material: Material | '';
  item: string;
  orderType: OrderType | '';
  
  // Step 2: Weight
  exchangeWt: string;
  deductWt: string;
  addedWt: string;
  totalWt: string;
  
  // Step 3: Amount
  ratePerGm: string;
  materialCost: string;
  makingCharge: string;
  otherCharge: string;
  totalCost: string;
  
  // Step 4: Delivery/Status
  deliveryDate: string;
  assignedTo?: string;
  status: string;
  remarks: string;
}

export const initialFormData: OrderFormData = {
  orderDate: new Date().toISOString().split('T')[0],
  billNo: 'Auto-generated',
  customerName: '',
  phoneNo: '',
  material: '',
  item: '',
  orderType: '',
  exchangeWt: '0',
  deductWt: '0',
  addedWt: '0',
  totalWt: '0',
  ratePerGm: '0',
  materialCost: '0',
  makingCharge: '0',
  otherCharge: '0',
  totalCost: '0',
  deliveryDate: '',
  assignedTo: '',
  status: 'Pending',
  remarks: ''
};

export interface WeightFieldsEnabled {
  exchangeWt: boolean;
  deductWt: boolean;
  addedWt: boolean;
}

/**
 * Determines which weight fields should be enabled based on the selected order type.
 * Rules:
 * - New Order: only Added Wt is active (Exchange Wt and Deduct Wt are disabled)
 * - Exchange Order: Exchange Wt, Deduct Wt, and Added Wt are all active
 * - New Readymade: only Added Wt is active (Exchange Wt and Deduct Wt are disabled)
 * - Exchange Readymade: Exchange Wt, Deduct Wt, and Added Wt are all active
 */
export function getWeightFieldsEnabled(orderType: OrderType | ''): WeightFieldsEnabled {
  switch (orderType) {
    case 'New Order':
      return {
        exchangeWt: false,
        deductWt: false,
        addedWt: true
      };
    case 'Exchange Order':
      return {
        exchangeWt: true,
        deductWt: true,
        addedWt: true
      };
    case 'New Readymade':
      return {
        exchangeWt: false,
        deductWt: false,
        addedWt: true
      };
    case 'Exchange Readymade':
      return {
        exchangeWt: true,
        deductWt: true,
        addedWt: true
      };
    default:
      // If no order type is selected, enable all fields
      return {
        exchangeWt: true,
        deductWt: true,
        addedWt: true
      };
  }
}
