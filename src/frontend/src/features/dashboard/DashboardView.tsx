import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useOrderStats } from './useOrderStats';
import { useRecentOrders } from '../orders/useRecentOrders';
import { useRepairOrderStats } from '../repairs/useRepairOrderStats';
import { useRecentRepairOrders } from '../repairs/useRecentRepairOrders';
import { usePiercingServiceStats } from '../misc/usePiercingServiceStats';
import { useOtherServiceStats } from '../misc/useOtherServiceStats';
import { useRecentPiercingServices } from '../misc/useRecentPiercingServices';
import { useRecentOtherServices } from '../misc/useRecentOtherServices';
import { formatDate, formatWeight } from '@/lib/formatters';
import { Package, Scale, TrendingUp, Loader2, Edit, Wrench, Scissors, Sparkles, Plus, ChevronDown } from 'lucide-react';

interface DashboardViewProps {
  onNewOrder: () => void;
  onViewOrders: () => void;
  onEditOrder: (billNo: number) => void;
  onNewRepairOrder: () => void;
  onViewRepairs: () => void;
  onEditRepair: (repairId: number) => void;
  onEditPiercing: (serviceId: number) => void;
  onEditOther: (serviceId: number) => void;
}

export default function DashboardView({ 
  onNewOrder, 
  onViewOrders, 
  onEditOrder,
  onNewRepairOrder,
  onViewRepairs, 
  onEditRepair,
  onEditPiercing,
  onEditOther
}: DashboardViewProps) {
  const { data: stats, isLoading: statsLoading, error: statsError } = useOrderStats();
  const { data: recentOrders, isLoading: ordersLoading, error: ordersError } = useRecentOrders(5);
  const { data: repairStats, isLoading: repairStatsLoading, error: repairStatsError } = useRepairOrderStats();
  const { data: recentRepairs, isLoading: repairsLoading } = useRecentRepairOrders(5);
  const { data: piercingStats, isLoading: piercingStatsLoading, error: piercingStatsError } = usePiercingServiceStats();
  const { data: otherStats, isLoading: otherStatsLoading, error: otherStatsError } = useOtherServiceStats();
  const { data: recentPiercingServices, isLoading: piercingServicesLoading } = useRecentPiercingServices(5);
  const { data: recentOtherServices, isLoading: otherServicesLoading } = useRecentOtherServices(5);

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'complete':
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

  const formatCurrency = (value: bigint): string => {
    return `₹${(Number(value) / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions Menu */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="shadow-elegant">
              <Plus className="h-4 w-4 mr-2" />
              Create New
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onNewOrder} className="cursor-pointer">
              <Package className="h-4 w-4 mr-2" />
              Create New Order
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNewRepairOrder} className="cursor-pointer">
              <Wrench className="h-4 w-4 mr-2" />
              Create New Repair Order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Order Stats Cards */}
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

      {/* Repair Order Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Repairs</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {repairStatsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : repairStatsError ? (
              <p className="text-sm text-destructive">Error loading</p>
            ) : (
              <div className="text-2xl font-bold">{Number(repairStats?.totalOrders || 0)}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Material Cost</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {repairStatsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : repairStatsError ? (
              <p className="text-sm text-destructive">Error loading</p>
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(repairStats?.totalMaterialCost || BigInt(0))}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Making Charge</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {repairStatsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : repairStatsError ? (
              <p className="text-sm text-destructive">Error loading</p>
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(repairStats?.totalMakingCharge || BigInt(0))}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {repairStatsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : repairStatsError ? (
              <p className="text-sm text-destructive">Error loading</p>
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(repairStats?.totalCost || BigInt(0))}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Misc Services Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Piercing Services</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {piercingStatsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : piercingStatsError ? (
              <p className="text-sm text-destructive">Error loading</p>
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold">{Number(piercingStats?.totalCount || 0)}</div>
                <div className="text-sm text-muted-foreground">
                  Total: {formatCurrency(piercingStats?.totalAmount || BigInt(0))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Other Services</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {otherStatsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : otherStatsError ? (
              <p className="text-sm text-destructive">Error loading</p>
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold">{Number(otherStats?.totalCount || 0)}</div>
                <div className="text-sm text-muted-foreground">
                  Total: {formatCurrency(otherStats?.totalAmount || BigInt(0))}
                </div>
              </div>
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

      {/* 1. Recent Orders Preview */}
      <Card className="shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onNewOrder}>
              <Plus className="h-4 w-4 mr-1" />
              New Order
            </Button>
            <Button variant="outline" size="sm" onClick={onViewOrders}>
              View All
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
                Failed to load recent orders. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {recentOrders && recentOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No orders yet. Create your first order!
            </div>
          )}

          {recentOrders && recentOrders.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Order Type</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Net Weight</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={Number(order.billNo)}>
                      <TableCell className="font-medium">{Number(order.billNo)}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.orderType}</TableCell>
                      <TableCell>{order.material}</TableCell>
                      <TableCell className="text-right">{formatWeight(order.netWeight)} gm</TableCell>
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

      {/* 2. Recent Repair Orders Preview with Add New Button */}
      <Card className="shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Repair Orders</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onNewRepairOrder}>
              <Plus className="h-4 w-4 mr-1" />
              New Repair Order
            </Button>
            <Button variant="outline" size="sm" onClick={onViewRepairs}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {repairsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {recentRepairs && recentRepairs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No repair orders yet. Create your first repair order!
            </div>
          )}

          {recentRepairs && recentRepairs.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRepairs.map((repair, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(repair.date)}</TableCell>
                      <TableCell>{repair.material}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(repair.totalCost)}</TableCell>
                      <TableCell>{repair.assignTo}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(repair.status)}>
                          {repair.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditRepair(index + 1)}
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

      {/* 3. Recent Piercing Services */}
      {recentPiercingServices && recentPiercingServices.length > 0 && (
        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Piercing Services</CardTitle>
          </CardHeader>
          <CardContent>
            {piercingServicesLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {recentPiercingServices && recentPiercingServices.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPiercingServices.map((service, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(service.date)}</TableCell>
                        <TableCell>{service.name}</TableCell>
                        <TableCell>{service.phone}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(service.amount)}</TableCell>
                        <TableCell className="max-w-xs truncate">{service.remarks || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditPiercing(index + 1)}
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
      )}

      {/* 4. Recent Other Services */}
      {recentOtherServices && recentOtherServices.length > 0 && (
        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Other Services</CardTitle>
          </CardHeader>
          <CardContent>
            {otherServicesLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {recentOtherServices && recentOtherServices.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOtherServices.map((service, index) => (
                      <TableRow key={index}>
                        <TableCell>{service.name}</TableCell>
                        <TableCell>{service.phone}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(service.amount)}</TableCell>
                        <TableCell className="max-w-xs truncate">{service.remarks || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditOther(index + 1)}
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
      )}
    </div>
  );
}
