import { useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import OrderWizard from './features/orders/OrderWizard';
import OrdersView from './features/orders/OrdersView';
import DashboardView from './features/dashboard/DashboardView';
import RepairWizard from './features/repairs/RepairWizard';
import RepairOrdersView from './features/repairs/RepairOrdersView';
import PiercingWizard from './features/misc/PiercingWizard';
import OtherWizard from './features/misc/OtherWizard';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPrompt from './components/LoginPrompt';
import { Gem, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';

type AppView = 'dashboard' | 'wizard' | 'orders' | 'repair' | 'repairWizard' | 'piercingWizard' | 'otherWizard';

interface SuccessPayload {
  billNo: number;
  isUpdate: boolean;
}

interface RepairSuccessPayload {
  repairId: number;
  isUpdate: boolean;
}

interface ServiceSuccessPayload {
  serviceId: number;
}

function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [successPayload, setSuccessPayload] = useState<SuccessPayload | null>(null);
  const [repairSuccessPayload, setRepairSuccessPayload] = useState<RepairSuccessPayload | null>(null);
  const [serviceSuccessPayload, setServiceSuccessPayload] = useState<ServiceSuccessPayload | null>(null);
  const [editingBillNo, setEditingBillNo] = useState<number | null>(null);
  const [editingRepairId, setEditingRepairId] = useState<number | null>(null);

  const isAuthenticated = !!identity;

  const handleOrderSaved = (billNo: bigint) => {
    setSuccessPayload({ billNo: Number(billNo), isUpdate: !!editingBillNo });
    setEditingBillNo(null);
    setCurrentView('orders');
  };

  const handleRepairSaved = (repairId: bigint) => {
    setRepairSuccessPayload({ repairId: Number(repairId), isUpdate: !!editingRepairId });
    setEditingRepairId(null);
    setCurrentView('repair');
  };

  const handleServiceSaved = (serviceId: bigint) => {
    setServiceSuccessPayload({ serviceId: Number(serviceId) });
    setCurrentView('dashboard');
  };

  const handleNewOrder = () => {
    setSuccessPayload(null);
    setEditingBillNo(null);
    setCurrentView('wizard');
  };

  const handleNewRepair = () => {
    setRepairSuccessPayload(null);
    setEditingRepairId(null);
    setCurrentView('repairWizard');
  };

  const handleNewPiercing = () => {
    setServiceSuccessPayload(null);
    setCurrentView('piercingWizard');
  };

  const handleNewOther = () => {
    setServiceSuccessPayload(null);
    setCurrentView('otherWizard');
  };

  const handleEditOrder = (billNo: number) => {
    setSuccessPayload(null);
    setEditingBillNo(billNo);
    setCurrentView('wizard');
  };

  const handleEditRepair = (repairId: number) => {
    setRepairSuccessPayload(null);
    setEditingRepairId(repairId);
    setCurrentView('repairWizard');
  };

  const handleViewOrders = () => {
    setSuccessPayload(null);
    setEditingBillNo(null);
    setCurrentView('orders');
  };

  const handleViewRepairs = () => {
    setRepairSuccessPayload(null);
    setEditingRepairId(null);
    setCurrentView('repair');
  };

  const handleViewDashboard = () => {
    setSuccessPayload(null);
    setRepairSuccessPayload(null);
    setServiceSuccessPayload(null);
    setEditingBillNo(null);
    setEditingRepairId(null);
    setCurrentView('dashboard');
  };

  const handleCancelWizard = () => {
    setEditingBillNo(null);
    setEditingRepairId(null);
    setCurrentView('dashboard');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header 
          currentView={currentView}
          onViewDashboard={handleViewDashboard}
          onViewOrders={handleViewOrders}
          onViewRepairs={handleViewRepairs}
          onNewPiercing={handleNewPiercing}
          onNewOther={handleNewOther}
        />
        <main className="flex-1 flex items-center justify-center p-4">
          <LoginPrompt />
        </main>
        <Footer />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        currentView={currentView}
        onViewDashboard={handleViewDashboard}
        onViewOrders={handleViewOrders}
        onViewRepairs={handleViewRepairs}
        onNewPiercing={handleNewPiercing}
        onNewOther={handleNewOther}
      />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Gem className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {currentView === 'dashboard' && 'Dashboard'}
                  {currentView === 'wizard' && (editingBillNo ? 'Edit Order' : 'New Order')}
                  {currentView === 'orders' && 'All Orders'}
                  {currentView === 'repair' && 'Repair Orders'}
                  {currentView === 'repairWizard' && (editingRepairId ? 'Edit Repair Order' : 'New Repair Order')}
                  {currentView === 'piercingWizard' && 'New Piercing Service'}
                  {currentView === 'otherWizard' && 'New Other Service'}
                </h1>
                <p className="text-muted-foreground">
                  {currentView === 'dashboard' && 'Overview of your jewellery business'}
                  {currentView === 'wizard' && (editingBillNo ? 'Update order details' : 'Create a new order')}
                  {currentView === 'orders' && 'Manage all your orders'}
                  {currentView === 'repair' && 'Manage all repair orders'}
                  {currentView === 'repairWizard' && (editingRepairId ? 'Update repair order details' : 'Create a new repair order')}
                  {currentView === 'piercingWizard' && 'Create a new piercing service'}
                  {currentView === 'otherWizard' && 'Create a new other service'}
                </p>
              </div>
            </div>
            
            {currentView !== 'dashboard' && (
              <Button variant="outline" onClick={handleViewDashboard}>
                Back to Dashboard
              </Button>
            )}
          </div>

          {/* Main Content */}
          {currentView === 'dashboard' && (
            <DashboardView 
              onNewOrder={handleNewOrder}
              onViewOrders={handleViewOrders}
              onEditOrder={handleEditOrder}
              onNewRepairOrder={handleNewRepair}
              onViewRepairs={handleViewRepairs}
              onEditRepair={handleEditRepair}
              onEditPiercing={() => {}}
              onEditOther={() => {}}
            />
          )}
          
          {currentView === 'wizard' && (
            <OrderWizard 
              onCancel={handleCancelWizard}
              onSuccess={handleOrderSaved}
              editBillNo={editingBillNo}
            />
          )}
          
          {currentView === 'orders' && (
            <OrdersView 
              onNewOrder={handleNewOrder}
              onEditOrder={handleEditOrder}
              successMessage={successPayload}
            />
          )}

          {currentView === 'repair' && (
            <RepairOrdersView 
              onNewRepair={handleNewRepair}
              onEditRepair={handleEditRepair}
              successPayload={repairSuccessPayload}
            />
          )}

          {currentView === 'repairWizard' && (
            <RepairWizard 
              onCancel={handleCancelWizard}
              onSuccess={handleRepairSaved}
              editRepairId={editingRepairId}
            />
          )}

          {currentView === 'piercingWizard' && (
            <PiercingWizard 
              onCancel={handleCancelWizard}
              onSuccess={handleServiceSaved}
            />
          )}

          {currentView === 'otherWizard' && (
            <OtherWizard 
              onCancel={handleCancelWizard}
              onSuccess={handleServiceSaved}
            />
          )}
        </div>
      </main>

      <Footer />
      <Toaster />
    </div>
  );
}

export default App;
