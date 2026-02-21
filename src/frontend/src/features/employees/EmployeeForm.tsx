import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAddEmployee } from './useAddEmployee';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EmployeeForm({ open, onOpenChange }: EmployeeFormProps) {
  const [name, setName] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phoneNo?: string }>({});

  const addEmployeeMutation = useAddEmployee();

  const validateForm = (): boolean => {
    const newErrors: { name?: string; phoneNo?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!phoneNo.trim()) {
      newErrors.phoneNo = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(phoneNo)) {
      newErrors.phoneNo = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await addEmployeeMutation.mutateAsync({ name: name.trim(), phoneNo: phoneNo.trim() });
      toast.success('Employee added successfully!');
      setName('');
      setPhoneNo('');
      setErrors({});
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to add employee';
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    setName('');
    setPhoneNo('');
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="Enter employee name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="phoneNo">Phone Number *</Label>
              <Input
                id="phoneNo"
                value={phoneNo}
                onChange={(e) => {
                  setPhoneNo(e.target.value);
                  if (errors.phoneNo) setErrors((prev) => ({ ...prev, phoneNo: undefined }));
                }}
                placeholder="Enter phone number"
                className={errors.phoneNo ? 'border-destructive' : ''}
              />
              {errors.phoneNo && <p className="text-sm text-destructive mt-1">{errors.phoneNo}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={addEmployeeMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={addEmployeeMutation.isPending}>
              {addEmployeeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Employee
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
