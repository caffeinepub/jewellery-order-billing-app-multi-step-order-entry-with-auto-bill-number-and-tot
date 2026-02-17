import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRecentOrders } from './useRecentOrders';
import { formatDate, formatWeight } from '@/lib/formatters';
import { CheckCircle2, Loader2, Edit } from 'lucide-react';

interface SuccessPayload {
  billNo: number;
  isUpdate: boolean;
}

interface OrdersViewProps {
  successPayload: SuccessPayload | null;
  onNewOrder: () => void;
  onEditOrder: (billNo: number) => void;
}

export default function OrdersView({ successPayload, onNewOrder, onEditOrder }: OrdersViewProps) {
  const { data: orders, isLoading, error } = useRecentOrders(20);

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successPayload && (
        <Alert className="bg-success/10 border-success">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            Order #{successPayload.billNo} {successPayload.isUpdate ? 'updated' : 'saved'} successfully!
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button onClick={onNewOrder}>New Order</Button>
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
                Failed to load orders. Please try again.
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
                    <TableHead className="text-right">Net Wt. (gm)</TableHead>
                    <TableHead className="text-right">Gross Wt. (gm)</TableHead>
                    <TableHead className="text-right">Cut Wt. (gm)</TableHead>
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
                      <TableCell className="text-right">{formatWeight(order.netWeight)}</TableCell>
                      <TableCell className="text-right">{formatWeight(order.grossWeight)}</TableCell>
                      <TableCell className="text-right">{formatWeight(order.cutWeight)}</TableCell>
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
