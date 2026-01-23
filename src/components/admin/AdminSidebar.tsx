import {
  LayoutDashboard,
  CreditCard,
  Users,
  Wallet,
  AlertTriangle,
  Settings,
  History,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from "@/assets/logo.png";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  stats: {
    pagosVerificar: number;
    usuariosVerificar: number;
    vendedoresPagar: number;
    disputasAbiertas: number;
  };
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pagos', label: 'Verificar Pagos', icon: CreditCard, statKey: 'pagosVerificar' as const },
  { id: 'usuarios', label: 'Verificar Usuarios', icon: Users, statKey: 'usuariosVerificar' as const },
  { id: 'vendedores', label: 'Pagar Vendedores', icon: Wallet, statKey: 'vendedoresPagar' as const },
  { id: 'disputas', label: 'Disputas', icon: AlertTriangle, statKey: 'disputasAbiertas' as const },
  { id: 'transacciones', label: 'Historial', icon: History },
  { id: 'reportes', label: 'Reportes', icon: BarChart3 },
  { id: 'metodos-pago', label: 'Métodos de Pago', icon: Settings },
  { id: 'roles', label: 'Gestionar Roles', icon: Shield },
];

export const AdminSidebar = ({
  activeTab,
  onTabChange,
  collapsed,
  onCollapsedChange,
  stats
}: AdminSidebarProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div
      className={cn(
        "h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-[70px]" : "w-[260px]"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
            <img src={logo} alt="Bakan Logo" className="h-10 w-auto object-contain" />
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg">Admin</h1>
                <p className="text-xs text-white/60">Centro de Control</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onCollapsedChange(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-700 hover:bg-slate-600 border border-white/20 p-0 z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </Button>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const count = item.statKey ? stats[item.statKey] : 0;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "hover:bg-white/10 text-white/70 hover:text-white"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0",
                isActive ? "text-white" : "text-white/70 group-hover:text-white"
              )} />

              {!collapsed && (
                <>
                  <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                  {count > 0 && (
                    <Badge
                      variant={item.id === 'disputas' ? 'destructive' : 'default'}
                      className={cn(
                        "min-w-[20px] h-5 flex items-center justify-center text-xs",
                        isActive ? "bg-white/20 text-white" : ""
                      )}
                    >
                      {count}
                    </Badge>
                  )}
                </>
              )}

              {collapsed && count > 0 && (
                <span className="absolute right-2 top-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-white/10">
        {!collapsed && (
          <div className="mb-3 px-3">
            <p className="text-xs text-white/50">Sesión activa</p>
            <p className="text-sm font-medium truncate">{user?.email || 'Admin'}</p>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/20 text-white/70 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};
