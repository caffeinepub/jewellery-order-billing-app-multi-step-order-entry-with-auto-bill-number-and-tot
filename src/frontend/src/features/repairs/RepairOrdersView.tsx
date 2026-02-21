import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useGetAllRepairOrders } from './useGetAllRepairOrders';
import { formatDate } from '@/lib/formatters';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface RepairOrdersViewProps {
  onNewRepair: () => void;
  onEditRepair: (repairId: number) => void;
  successPayload?: { repairId: number; isUpdate: boolean } | null;
}

export default function RepairOrdersView({ onNewRepair, onEditRepair, successPayload }: RepairOrdersViewProps) {
  const { data: repairs, isLoading, error } = useGetAllRepairOrders();

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'complete':
        return 'default';
      case 'on process':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getDeliveryStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'default';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatCurrency = (value: bigint): string => {
    return `₹${(Number(value) / 100).toFixed(2)}`;
  };

  const formatWeight = (value: bigint): string => {
    return (Number(value) / 100).toFixed(2);
  };

  console.log('RepairOrdersView: Rendering with', repairs?.length || 0, 'repair orders');
  if (error) {
    console.error('RepairOrdersView: Error loading repair orders:', error);
  }

  return (
    <div className="space-y-6">
      {successPayload && (
        <Alert className="border-success bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription>
            Repair Order has been {successPayload.isUpdate ? 'updated' : 'saved'} successfully!
          </AlertDescription>
        </Alert>
      )}

      <Alert className="border-warning bg-warning/10">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription>
          Note: Editing repair orders is temporarily disabled due to a backend limitation. The backend needs to include repair IDs in the returned records. Please contact support if you need to edit existing repair orders.
        </AlertDescription>
      </Alert>

      <Card className="shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Repair Orders</CardTitle>
          <Button onClick={onNewRepair}>
            New Repair Order
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error instanceof Error ? error.message : 'Failed to load repair orders. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {repairs && repairs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No repair orders found. Create your first repair order to get started.
            </div>
          )}

          {repairs && repairs.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Added Wt. (gm)</TableHead>
                    <TableHead className="text-right">Material Cost</TableHead>
                    <TableHead className="text-right">Making Charge</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repairs.map((repair, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(repair.date)}</TableCell>
                      <TableCell>{repair.material}</TableCell>
                      <TableCell className="text-right">{formatWeight(repair.addedMaterialWeight)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(repair.materialCost)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(repair.makingCharge)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(repair.totalCost)}</TableCell>
                      <TableCell>
                        {repair.deliveryDate && Number(repair.deliveryDate) > 0 
                          ? formatDate(repair.deliveryDate)
                          : <span className="text-muted-foreground">Not set</span>
                        }
                      </TableCell>
                      <TableCell>{repair.assignTo}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(repair.status)}>
                          {repair.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getDeliveryStatusBadgeVariant(repair.deliveryStatus)}>
                          {repair.deliveryStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
