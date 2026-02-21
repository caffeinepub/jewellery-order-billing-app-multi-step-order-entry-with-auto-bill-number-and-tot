export const REPAIR_MATERIALS = ['Gold', 'Silver', 'Other'] as const;
export type RepairMaterial = typeof REPAIR_MATERIALS[number];

export const REPAIR_STATUSES = ['On process', 'Complete'] as const;
export type RepairStatus = typeof REPAIR_STATUSES[number];

export const DELIVERY_STATUSES = ['Pending', 'Delivered'] as const;
export type DeliveryStatus = typeof DELIVERY_STATUSES[number];

export interface RepairFormData {
  date: string;
  material: RepairMaterial | '';
  addedMaterialWeight: string;
  materialCost: string;
  makingCharge: string;
  totalCost: string;
  deliveryDate: string;
  assignedTo?: string;
  status: RepairStatus | '';
  deliveryStatus: DeliveryStatus | '';
}

export const initialRepairFormData: RepairFormData = {
  date: new Date().toISOString().split('T')[0],
  material: '',
  addedMaterialWeight: '0',
  materialCost: '0',
  makingCharge: '0',
  totalCost: '0',
  deliveryDate: '',
  assignedTo: '',
  status: 'On process',
  deliveryStatus: 'Pending'
};
