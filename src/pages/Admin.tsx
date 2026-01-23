import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminTransactionsHistory } from '@/components/admin/AdminTransactionsHistory';
import { AdminReports } from '@/components/admin/AdminReports';
import { VerificarPagosTab } from '@/components/admin/VerificarPagosTab';
import { VerificarUsuariosTab } from '@/components/admin/VerificarUsuariosTab';
import { PagarVendedoresTab } from '@/components/admin/PagarVendedoresTab';
import { GestionarDisputasTab } from '@/components/admin/GestionarDisputasTab';
import { GestionarMetodosPagoTab } from '@/components/admin/GestionarMetodosPagoTab';
import { GestionarRolesTab } from '@/components/admin/GestionarRolesTab';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Stats {
  pagosVerificar: number;
  usuariosVerificar: number;
  vendedoresPagar: number;
  disputasAbiertas: number;
}

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({
    pagosVerificar: 0,
    usuariosVerificar: 0,
    vendedoresPagar: 0,
    disputasAbiertas: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && !isAdmin) {
      toast.error('No tienes permisos de administrador');
      navigate('/dashboard');
    } else if (user && isAdmin) {
      fetchStats();
    }
  }, [user, loading, isAdmin, navigate]);

  const fetchStats = async () => {
    try {
      const [pagosResult, usuariosResult, vendedoresResult, disputasResult] = await Promise.all([
        supabase.from('transacciones').select('*', { count: 'exact', head: true }).eq('estado', 'pago_en_verificacion'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('estado_verificacion', 'pendiente_revision'),
        supabase.from('transacciones').select('*', { count: 'exact', head: true }).eq('estado', 'completada').eq('estado_pago_vendedor', 'pendiente_de_pago'),
        supabase.from('disputas').select('*', { count: 'exact', head: true }).in('estado_disputa', ['abierta', 'en_investigacion'])
      ]);

      setStats({
        pagosVerificar: pagosResult.count || 0,
        usuariosVerificar: usuariosResult.count || 0,
        vendedoresPagar: vendedoresResult.count || 0,
        disputasAbiertas: disputasResult.count || 0
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'pagos':
        return <VerificarPagosTab onUpdate={fetchStats} />;
      case 'usuarios':
        return <VerificarUsuariosTab onUpdate={fetchStats} />;
      case 'vendedores':
        return <PagarVendedoresTab onUpdate={fetchStats} />;
      case 'disputas':
        return <GestionarDisputasTab onUpdate={fetchStats} />;
      case 'transacciones':
        return <AdminTransactionsHistory />;
      case 'reportes':
        return <AdminReports />;
      case 'metodos-pago':
        return <GestionarMetodosPagoTab />;
      case 'roles':
        return <GestionarRolesTab />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:relative z-40 transition-transform duration-300",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          stats={stats}
        />
      </div>

      {/* Main Content */}
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300",
        "p-4 lg:p-8 pt-16 lg:pt-8"
      )}>
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Admin;
