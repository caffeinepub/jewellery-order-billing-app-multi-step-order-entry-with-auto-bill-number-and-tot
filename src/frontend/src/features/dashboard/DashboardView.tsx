import { useState } from 'react';
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
import { useGetAllPiercingServices } from '../misc/useGetAllPiercingServices';
import { useGetAllOtherServices } from '../misc/useGetAllOtherServices';
import { useListEmployees } from '../employees/useListEmployees';
import EmployeeForm from '../employees/EmployeeForm';
import { formatDate, formatWeight } from '@/lib/formatters';
import { Package, Scale, TrendingUp, Loader2, Edit, Wrench, Scissors, Sparkles, Plus, ChevronDown, Users, AlertTriangle } from 'lucide-react';

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
  const [employeeFormOpen, setEmployeeFormOpen] = useState(false);

  const { data: stats, isLoading: statsLoading, error: statsError } = useOrderStats();
  const { data: recentOrders, isLoading: ordersLoading, error: ordersError } = useRecentOrders(5);
  const { data: repairStats, isLoading: repairStatsLoading, error: repairStatsError } = useRepairOrderStats();
  const { data: recentRepairs, isLoading: repairsLoading, error: repairsError } = useRecentRepairOrders(5);
  const { data: piercingStats, isLoading: piercingStatsLoading, error: piercingStatsError } = usePiercingServiceStats();
  const { data: otherStats, isLoading: otherStatsLoading, error: otherStatsError } = useOtherServiceStats();
  const { data: allPiercingServices, isLoading: piercingServicesLoading, error: piercingServicesError } = useGetAllPiercingServices();
  const { data: allOtherServices, isLoading: otherServicesLoading, error: otherServicesError } = useGetAllOtherServices();
  const { data: employees, isLoading: employeesLoading, error: employeesError } = useListEmployees();

  console.log('DashboardView: Rendering dashboard');
  console.log('DashboardView: Orders:', recentOrders?.length || 0, 'Error:', ordersError);
  console.log('DashboardView: Repairs:', recentRepairs?.length || 0, 'Error:', repairsError);
  console.log('DashboardView: Piercing services:', allPiercingServices?.length || 0, 'Error:', piercingServicesError);
  console.log('DashboardView: Other services:', allOtherServices?.length || 0, 'Error:', otherServicesError);

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

  // Combine and sort all services by date (most recent first)
  const allServices = [
    ...(allPiercingServices || []).map((service, index) => ({
      id: index + 1,
      type: 'piercing' as const,
      date: service.date,
      name: service.name,
      phone: service.phone,
      amount: service.amount,
      remarks: service.remarks
    })),
    ...(allOtherServices || []).map((service, index) => ({
      id: index + 1,
      type: 'other' as const,
      date: BigInt(Date.now() * 1000000), // Other services don't have date, use current time
      name: service.name,
      phone: service.phone,
      amount: service.amount,
      remarks: service.remarks
    }))
  ].sort((a, b) => Number(b.date - a.date)).slice(0, 10);

  console.log('DashboardView: Combined services:', allServices.length);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Repair Orders</CardTitle>
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
            <CardTitle className="text-sm font-medium">Total Material Cost</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Total Repair Cost</CardTitle>
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

      {/* Service Stats Cards */}
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
              <div>
                <div className="text-2xl font-bold">{Number(piercingStats?.totalCount || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {formatCurrency(piercingStats?.totalAmount || BigInt(0))}
                </p>
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
              <div>
                <div className="text-2xl font-bold">{Number(otherStats?.totalCount || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {formatCurrency(otherStats?.totalAmount || BigInt(0))}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button variant="outline" size="sm" onClick={onViewOrders}>
            View All
          </Button>
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
                {ordersError instanceof Error ? ordersError.message : 'Failed to load orders'}
              </AlertDescription>
            </Alert>
          )}

          {recentOrders && recentOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No orders yet
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

      {/* Recent Repair Orders */}
      <Card className="shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Repair Orders</CardTitle>
          <Button variant="outline" size="sm" onClick={onViewRepairs}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {repairsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {repairsError && (
            <Alert variant="destructive">
              <AlertDescription>
                {repairsError instanceof Error ? repairsError.message : 'Failed to load repair orders'}
              </AlertDescription>
            </Alert>
          )}

          {recentRepairs && recentRepairs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No repair orders yet
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
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRepairs.map((repair, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(repair.date)}</TableCell>
                      <TableCell>{repair.material}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(repair.totalCost)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(repair.status)}>
                          {repair.status}
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

      {/* All Services Table */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Recent Services</CardTitle>
        </CardHeader>
        <CardContent>
          {(piercingServicesLoading || otherServicesLoading) && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {(piercingServicesError || otherServicesError) && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {piercingServicesError instanceof Error ? piercingServicesError.message : 
                 otherServicesError instanceof Error ? otherServicesError.message : 
                 'Failed to load services'}
              </AlertDescription>
            </Alert>
          )}

          {allServices.length === 0 && !piercingServicesLoading && !otherServicesLoading && (
            <div className="text-center py-8 text-muted-foreground">
              No services yet
            </div>
          )}

          {allServices.length > 0 && (
            <>
              <Alert className="border-warning bg-warning/10 mb-4">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription>
                  Note: Service records are displayed for viewing only. Editing is temporarily disabled due to a backend limitation.
                </AlertDescription>
              </Alert>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allServices.map((service, index) => (
                      <TableRow key={`${service.type}-${index}`}>
                        <TableCell>
                          <Badge variant={service.type === 'piercing' ? 'default' : 'secondary'}>
                            {service.type === 'piercing' ? 'Piercing' : 'Other'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(service.date)}</TableCell>
                        <TableCell>{service.name}</TableCell>
                        <TableCell>{service.phone}</TableCell>
                        <TableCell className="text-right">{formatCurrency(service.amount)}</TableCell>
                        <TableCell className="max-w-xs truncate">{service.remarks || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Employees Section */}
      <Card className="shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Employees</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEmployeeFormOpen(true)}>
            <Users className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </CardHeader>
        <CardContent>
          {employeesLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {employeesError && (
            <Alert variant="destructive">
              <AlertDescription>
                {employeesError instanceof Error ? employeesError.message : 'Failed to load employees'}
              </AlertDescription>
            </Alert>
          )}

          {employees && employees.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No employees yet. Add your first employee to get started.
            </div>
          )}

          {employees && employees.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={Number(employee.id)}>
                      <TableCell className="font-medium">#{Number(employee.id)}</TableCell>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.phoneNo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <EmployeeForm open={employeeFormOpen} onOpenChange={setEmployeeFormOpen} />
    </div>
  );
}
