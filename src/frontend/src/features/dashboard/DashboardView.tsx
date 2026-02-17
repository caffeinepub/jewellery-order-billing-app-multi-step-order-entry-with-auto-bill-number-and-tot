import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOrderStats } from './useOrderStats';
import { useRecentOrders } from '../orders/useRecentOrders';
import { formatDate, formatWeight } from '@/lib/formatters';
import { Package, Scale, TrendingUp, Loader2, Edit } from 'lucide-react';

interface DashboardViewProps {
  onNewOrder: () => void;
  onViewOrders: () => void;
  onEditOrder: (billNo: number) => void;
}

export default function DashboardView({ onNewOrder, onViewOrders, onEditOrder }: DashboardViewProps) {
  const { data: stats, isLoading: statsLoading, error: statsError } = useOrderStats();
  const { data: recentOrders, isLoading: ordersLoading, error: ordersError } = useRecentOrders(5);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : statsError ? (
              <p className="text-sm text-destructive">Error loading</p>
            ) : (
              <div className="text-2xl font-bold">{Number(stats?.totalOrders || 0)}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gross Weight</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : statsError ? (
              <p className="text-sm text-destructive">Error loading</p>
            ) : (
              <div className="text-2xl font-bold">{formatWeight(stats?.totalGrossWeight || BigInt(0))} gm</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Weight</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : statsError ? (
              <p className="text-sm text-destructive">Error loading</p>
            ) : (
              <div className="text-2xl font-bold">{formatWeight(stats?.totalNetWeight || BigInt(0))} gm</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Material Breakdown */}
      {stats && (
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Material Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Cut Weight:</span>
                <span className="font-semibold">{formatWeight(stats.totalCutWeight)} gm</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders Preview */}
      <Card className="shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onViewOrders}>
              View All
            </Button>
            <Button size="sm" onClick={onNewOrder}>
              New Order
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ordersLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {ordersError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load recent orders.
              </AlertDescription>
            </Alert>
          )}

          {recentOrders && recentOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No orders yet. Create your first order to get started.
            </div>
          )}

          {recentOrders && recentOrders.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Net Wt. (gm)</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={Number(order.billNo)}>
                      <TableCell className="font-medium">#{Number(order.billNo)}</TableCell>
                      <TableCell>{formatDate(order.timestamp)}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.material}</TableCell>
                      <TableCell className="text-right">{formatWeight(order.netWeight)}</TableCell>
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
