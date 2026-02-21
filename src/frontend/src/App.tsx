import { useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import OrderWizard from './features/orders/OrderWizard';
import OrdersView from './features/orders/OrdersView';
import DashboardView from './features/dashboard/DashboardView';
import RepairWizard from './features/repairs/RepairWizard';
import RepairOrdersView from './features/repairs/RepairOrdersView';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPrompt from './components/LoginPrompt';
import { Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AppView = 'dashboard' | 'wizard' | 'orders' | 'repair' | 'repairWizard';

interface SuccessPayload {
  billNo: number;
  isUpdate: boolean;
}

interface RepairSuccessPayload {
  repairId: number;
  isUpdate: boolean;
}

function App() {
  const { identity } = useInternetIdentity();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [successPayload, setSuccessPayload] = useState<SuccessPayload | null>(null);
  const [repairSuccessPayload, setRepairSuccessPayload] = useState<RepairSuccessPayload | null>(null);
  const [editingBillNo, setEditingBillNo] = useState<number | null>(null);
  const [editingRepairId, setEditingRepairId] = useState<number | null>(null);

  const isAuthenticated = !!identity;

  const handleOrderSaved = (billNo: number, isUpdate: boolean = false) => {
    setSuccessPayload({ billNo, isUpdate });
    setEditingBillNo(null);
    setCurrentView('orders');
  };

  const handleRepairSaved = (repairId: number, isUpdate: boolean = false) => {
    setRepairSuccessPayload({ repairId, isUpdate });
    setEditingRepairId(null);
    setCurrentView('repair');
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
    setEditingBillNo(null);
    setEditingRepairId(null);
    setCurrentView('dashboard');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header 
          currentView={currentView}
          onViewDashboard={handleViewDashboard}
          onViewOrders={handleViewOrders}
          onViewRepairs={handleViewRepairs}
        />
        <main className="flex-1 flex items-center justify-center p-4">
          <LoginPrompt />
        </main>
        <Footer />
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
      />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Gem className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Jewellery Order Management</h1>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'outline'}
              onClick={handleViewDashboard}
            >
              Dashboard
            </Button>
            <Button
              variant={currentView === 'wizard' ? 'default' : 'outline'}
              onClick={handleNewOrder}
            >
              New Order
            </Button>
            <Button
              variant={currentView === 'orders' ? 'default' : 'outline'}
              onClick={handleViewOrders}
            >
              Orders
            </Button>
            <Button
              variant={currentView === 'repair' || currentView === 'repairWizard' ? 'default' : 'outline'}
              onClick={handleViewRepairs}
            >
              Repair
            </Button>
          </div>

          {/* View Content */}
          {currentView === 'dashboard' && (
            <DashboardView 
              onNewOrder={handleNewOrder} 
              onViewOrders={handleViewOrders}
              onEditOrder={handleEditOrder}
              onViewRepairs={handleViewRepairs}
              onEditRepair={handleEditRepair}
            />
          )}
          {currentView === 'wizard' && (
            <OrderWizard 
              onOrderSaved={handleOrderSaved}
              editingBillNo={editingBillNo}
            />
          )}
          {currentView === 'orders' && (
            <OrdersView 
              successMessage={successPayload} 
              onNewOrder={handleNewOrder}
              onEditOrder={handleEditOrder}
            />
          )}
          {currentView === 'repair' && (
            <RepairOrdersView
              successPayload={repairSuccessPayload}
              onNewRepair={handleNewRepair}
              onEditRepair={handleEditRepair}
            />
          )}
          {currentView === 'repairWizard' && (
            <RepairWizard
              onRepairSaved={handleRepairSaved}
              editingRepairId={editingRepairId}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
