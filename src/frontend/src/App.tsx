import { useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import OrderWizard from './features/orders/OrderWizard';
import OrdersView from './features/orders/OrdersView';
import DashboardView from './features/dashboard/DashboardView';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPrompt from './components/LoginPrompt';
import { Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AppView = 'dashboard' | 'wizard' | 'orders';

interface SuccessPayload {
  billNo: number;
  isUpdate: boolean;
}

function App() {
  const { identity } = useInternetIdentity();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [successPayload, setSuccessPayload] = useState<SuccessPayload | null>(null);
  const [editingBillNo, setEditingBillNo] = useState<number | null>(null);

  const isAuthenticated = !!identity;

  const handleOrderSaved = (billNo: number, isUpdate: boolean = false) => {
    setSuccessPayload({ billNo, isUpdate });
    setEditingBillNo(null);
    setCurrentView('orders');
  };

  const handleNewOrder = () => {
    setSuccessPayload(null);
    setEditingBillNo(null);
    setCurrentView('wizard');
  };

  const handleEditOrder = (billNo: number) => {
    setSuccessPayload(null);
    setEditingBillNo(billNo);
    setCurrentView('wizard');
  };

  const handleViewOrders = () => {
    setSuccessPayload(null);
    setEditingBillNo(null);
    setCurrentView('orders');
  };

  const handleViewDashboard = () => {
    setSuccessPayload(null);
    setEditingBillNo(null);
    setCurrentView('dashboard');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <LoginPrompt />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Gem className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Jewellery Order Management</h1>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-center gap-2 mb-8">
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
              Recent Orders
            </Button>
          </div>

          {/* View Content */}
          {currentView === 'dashboard' && (
            <DashboardView 
              onNewOrder={handleNewOrder} 
              onViewOrders={handleViewOrders}
              onEditOrder={handleEditOrder}
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
              successPayload={successPayload} 
              onNewOrder={handleNewOrder}
              onEditOrder={handleEditOrder}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
