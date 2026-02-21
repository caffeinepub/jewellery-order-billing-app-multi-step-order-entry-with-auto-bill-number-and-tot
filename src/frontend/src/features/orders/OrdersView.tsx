import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useGetAllOrders } from './useGetAllOrders';
import { formatDate, formatWeight } from '@/lib/formatters';
import { Loader2, Edit, CheckCircle2 } from 'lucide-react';

interface OrdersViewProps {
  onNewOrder: () => void;
  onEditOrder: (billNo: number) => void;
  successMessage?: { billNo: number; isUpdate: boolean } | null;
}

export default function OrdersView({ onNewOrder, onEditOrder, successMessage }: OrdersViewProps) {
  const { data: orders, isLoading, error } = useGetAllOrders();

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'default';
      case 'on process':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'pending':
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <Alert className="border-success bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription>
            Order #{successMessage.billNo} has been {successMessage.isUpdate ? 'updated' : 'saved'} successfully!
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Orders</CardTitle>
          <Button onClick={onNewOrder}>
            New Order
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
                {error instanceof Error ? error.message : 'Failed to load orders. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {orders && orders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No orders found. Create your first order to get started.
            </div>
          )}

          {orders && orders.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Order Type</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Net Wt. (gm)</TableHead>
                    <TableHead className="text-right">Gross Wt. (gm)</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={Number(order.billNo)}>
                      <TableCell className="font-medium">#{Number(order.billNo)}</TableCell>
                      <TableCell>{formatDate(order.timestamp)}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.material}</TableCell>
                      <TableCell>{order.orderType}</TableCell>
                      <TableCell>
                        {order.deliveryDate && Number(order.deliveryDate) > 0 
                          ? formatDate(order.deliveryDate)
                          : <span className="text-muted-foreground">Not set</span>
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.pickupLocation || 'Pending')}>
                          {order.pickupLocation || 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatWeight(order.netWeight)}</TableCell>
                      <TableCell className="text-right">{formatWeight(order.grossWeight)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditOrder(Number(order.billNo))}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
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
