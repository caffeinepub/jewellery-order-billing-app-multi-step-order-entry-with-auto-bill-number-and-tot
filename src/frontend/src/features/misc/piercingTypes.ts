export interface PiercingFormData {
  date: string;
  name: string;
  phone: string;
  amount: string;
  remarks: string;
}

export const initialPiercingFormData: PiercingFormData = {
  date: new Date().toISOString().split('T')[0],
  name: '',
  phone: '',
  amount: '',
  remarks: ''
};
