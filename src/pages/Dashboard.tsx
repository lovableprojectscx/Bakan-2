import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Wallet,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/Header';
import { IniciarVentaDialog } from '@/components/dashboard/IniciarVentaDialog';
import { UnirseCompraDialog } from '@/components/dashboard/UnirseCompraDialog';

interface Transaccion {
  id: string;
  codigo_invitacion: string;
  titulo_producto: string;
  precio_producto: number;
  estado: string;
  tipo_producto: string;
  fecha_creacion: string;
  vendedor_id: string;
  comprador_id: string | null;
  descripcion: string | null;
}

const estadoConfig = {
  iniciada: { label: 'Iniciada', color: 'bg-muted text-muted-foreground', icon: Clock },
  pendiente_pago: { label: 'Pendiente de Pago', color: 'bg-amber-500/10 text-amber-600 border border-amber-500/20', icon: Clock },
  pago_en_verificacion: { label: 'Verificando', color: 'bg-blue-500/10 text-blue-600 border border-blue-500/20', icon: AlertCircle },
  pagada_retenida: { label: 'Retenida', color: 'bg-violet-500/10 text-violet-600 border border-violet-500/20', icon: Shield },
  enviado: { label: 'Enviado', color: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20', icon: Package },
  completada: { label: 'Completada', color: 'bg-success/10 text-success border border-success/20', icon: CheckCircle },
  en_disputa: { label: 'En Disputa', color: 'bg-destructive/10 text-destructive border border-destructive/20', icon: AlertCircle },
  cancelada: { label: 'Cancelada', color: 'bg-muted text-muted-foreground', icon: AlertCircle },
  cancelada_automatico: { label: 'Cancelada', color: 'bg-muted text-muted-foreground', icon: AlertCircle }
};

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loadingTransacciones, setLoadingTransacciones] = useState(true);
  const [tienePerfilFinanciero, setTienePerfilFinanciero] = useState(true);
  const [verificandoPerfil, setVerificandoPerfil] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTransacciones();
      verificarPerfilFinanciero();

      // Subscribe only to user's transactions using filter
      const channel = supabase
        .channel('transacciones-user-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transacciones',
            filter: `vendedor_id=eq.${user.id}`
          },
          () => {
            fetchTransacciones();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transacciones',
            filter: `comprador_id=eq.${user.id}`
          },
          () => {
            fetchTransacciones();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const verificarPerfilFinanciero = async () => {
    try {
      const { data, error } = await supabase
        .from('perfiles_financieros')
        .select('id')
        .eq('usuario_id', user?.id)
        .eq('esta_activo', true)
        .limit(1);

      if (error) throw error;
      setTienePerfilFinanciero(data && data.length > 0);
    } catch (error: any) {
      console.error('Error al verificar perfil financiero:', error.message);
    } finally {
      setVerificandoPerfil(false);
    }
  };

  const fetchTransacciones = async () => {
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .or(`vendedor_id.eq.${user?.id},comprador_id.eq.${user?.id}`)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      setTransacciones(data || []);
    } catch (error: any) {
      toast.error('Error al cargar transacciones: ' + error.message);
    } finally {
      setLoadingTransacciones(false);
    }
  };

  const transaccionesVendedor = transacciones.filter(t => t.vendedor_id === user?.id);
  const transaccionesComprador = transacciones.filter(t => t.comprador_id === user?.id);
  const transaccionesActivas = transacciones.filter(t =>
    !['completada', 'cancelada', 'cancelada_automatico'].includes(t.estado)
  );

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 pt-24 md:pt-28 pb-12 animate-fade-in">

        {/* Header Section - Clean & Direct */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8 border-b border-gray-200 pb-6 md:pb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Dashboard
            </h1>
            <p className="text-sm md:text-base text-gray-500 mt-1">
              Bienvenido de nuevo, <span className="font-medium text-gray-900">{user?.email?.split('@')[0]}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-gray-200 shadow-sm w-fit">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500" />
            <span className="text-xs md:text-sm font-medium text-gray-600">Cuenta Verificada</span>
          </div>
        </div>

        {/* Action Alert */}
        {!verificandoPerfil && !tienePerfilFinanciero && (
          <div className="mb-8 md:mb-10 bg-white border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border-l-4 border-l-amber-500">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-50 rounded-full shrink-0">
                <Wallet className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Configuración Pendiente</h3>
                <p className="text-sm text-gray-500">Agrega tu cuenta bancaria para recibir pagos.</p>
              </div>
            </div>
            <Link to="/profile" className="w-full sm:w-auto">
              <Button size="sm" variant="outline" className="w-full sm:w-auto text-amber-700 border-amber-200 hover:bg-amber-50">
                Configurar
              </Button>
            </Link>
          </div>
        )}

        {/* Quick Actions - Corporate Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">

          {/* Vendedor - Clean Professional Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5">
              <Zap className="w-24 h-24 md:w-32 md:h-32 text-gray-900 transform rotate-12" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <div className="p-1.5 md:p-2 bg-blue-50 rounded-lg border border-blue-100">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <span className="text-xs md:text-sm font-semibold text-blue-600 uppercase tracking-wide">Vendedor</span>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Iniciar Venta</h3>
              <p className="text-sm md:text-base text-gray-500 mb-6 md:mb-8 max-w-sm">
                Genera una orden de pago segura.
              </p>

              <IniciarVentaDialog onTransactionCreated={fetchTransacciones}>
                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white h-10 md:h-11 font-medium transition-all text-sm md:text-base">
                  Crear Nueva Orden
                </Button>
              </IniciarVentaDialog>
            </div>
          </div>

          {/* Comprador - Clean Professional Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5">
              <ShoppingCart className="w-24 h-24 md:w-32 md:h-32 text-gray-900 transform -rotate-12" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <div className="p-1.5 md:p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                  <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                </div>
                <span className="text-xs md:text-sm font-semibold text-emerald-600 uppercase tracking-wide">Comprador</span>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Unirse a Compra</h3>
              <p className="text-sm md:text-base text-gray-500 mb-6 md:mb-8 max-w-sm">
                Realiza un pago seguro con código.
              </p>

              <UnirseCompraDialog onJoined={fetchTransacciones}>
                <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 h-10 md:h-11 font-medium transition-all text-sm md:text-base">
                  Ingresar Código
                </Button>
              </UnirseCompraDialog>
            </div>
          </div>
        </div>

        {/* Stats - Minimalist Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-10">
          {[
            { label: 'Activas', value: transaccionesActivas.length, icon: TrendingUp },
            { label: 'Ventas', value: transaccionesVendedor.length, icon: Package },
            { label: 'Compras', value: transaccionesComprador.length, icon: ShoppingCart }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <span className="text-xs md:text-sm font-medium text-gray-500">{stat.label}</span>
                <stat.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
              </div>
              <p className="text-xl md:text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Transactions Table Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-base md:text-lg font-bold text-gray-900">Actividad Reciente</h2>
            <Link to="/transactions" className="text-xs md:text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
              Ver historial completo
            </Link>
          </div>

          <div className="p-3 md:p-6">
            <Tabs defaultValue="activas" className="w-full">
              <div className="overflow-x-auto pb-4 md:pb-0 -mx-3 px-3 md:mx-0 md:px-0">
                <TabsList className="w-max sm:w-auto bg-gray-100 p-1 rounded-lg mb-4 md:mb-6">
                  {[
                    { value: 'activas', label: 'En Curso' },
                    { value: 'vendedor', label: 'Ventas' },
                    { value: 'comprador', label: 'Compras' },
                    { value: 'historial', label: 'Finalizadas' },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="px-4 py-1.5 md:px-6 md:py-2 rounded-md text-xs md:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 transition-all"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="space-y-3 md:space-y-4">
                <TabsContent value="activas" className="focus-visible:outline-none">
                  {transaccionesActivas.length === 0 ? (
                    <EmptyState title="Sin actividad" description="No hay operaciones en curso." />
                  ) : (
                    transaccionesActivas.map((t, i) => <TransaccionCard key={t.id} transaccion={t} userId={user.id} navigate={navigate} delay={i * 0} />)
                  )}
                </TabsContent>

                <TabsContent value="vendedor" className="focus-visible:outline-none">
                  {transaccionesVendedor.length === 0 ? (
                    <EmptyState title="Sin ventas" description="No has generado ventas." />
                  ) : (
                    transaccionesVendedor.map((t, i) => <TransaccionCard key={t.id} transaccion={t} userId={user.id} navigate={navigate} delay={i * 0} />)
                  )}
                </TabsContent>

                <TabsContent value="comprador" className="focus-visible:outline-none">
                  {transaccionesComprador.length === 0 ? (
                    <EmptyState title="Sin compras" description="No tienes compras." />
                  ) : (
                    transaccionesComprador.map((t, i) => <TransaccionCard key={t.id} transaccion={t} userId={user.id} navigate={navigate} delay={i * 0} />)
                  )}
                </TabsContent>

                <TabsContent value="historial" className="focus-visible:outline-none">
                  {transacciones.filter(t => ['completada', 'cancelada', 'cancelada_automatico'].includes(t.estado)).length === 0 ? (
                    <EmptyState title="Historial vacío" description="Sin operaciones finalizadas." />
                  ) : (
                    transacciones.filter(t => ['completada', 'cancelada', 'cancelada_automatico'].includes(t.estado)).map((t, i) => <TransaccionCard key={t.id} transaccion={t} userId={user.id} navigate={navigate} delay={i * 0} />)
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

const EmptyState = ({ title, description, icon: Icon }: { title: string; description: string; icon?: any }) => (
  <div className="flex flex-col items-center justify-center py-10 md:py-12 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
    <div className="p-3 bg-white rounded-full shadow-sm mb-3">
      {Icon ? <Icon className="w-5 h-5 md:w-6 md:h-6 text-gray-300" /> : <Package className="w-5 h-5 md:w-6 md:h-6 text-gray-300" />}
    </div>
    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    <p className="text-xs md:text-sm text-gray-500 mt-1">{description}</p>
  </div>
);

const TransaccionCard = ({
  transaccion,
  userId,
  navigate,
  delay = 0
}: {
  transaccion: Transaccion;
  userId: string;
  navigate: (path: string) => void;
  delay?: number;
}) => {
  const esVendedor = transaccion.vendedor_id === userId;
  const config = estadoConfig[transaccion.estado as keyof typeof estadoConfig];
  const IconComponent = config?.icon || Clock;

  return (
    <div
      className="group bg-white border border-gray-200 rounded-lg p-3 md:p-4 hover:border-blue-300 transition-colors cursor-pointer flex flex-col gap-3 md:gap-4 md:flex-row md:items-center justify-between"
      onClick={() => navigate(`/transaction/${transaccion.id}`)}
    >
      <div className="flex items-start md:items-center gap-3 md:gap-4">
        <div className={`p-2 md:p-3 rounded-lg shrink-0 ${esVendedor ? 'bg-blue-50' : 'bg-emerald-50'}`}>
          <Package className={`w-4 h-4 md:w-5 md:h-5 ${esVendedor ? 'text-blue-600' : 'text-emerald-600'}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] md:text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[80px] md:max-w-none">
              {transaccion.codigo_invitacion}
            </span>
            <Badge variant="secondary" className={`text-[10px] px-2 h-5 font-normal ${esVendedor ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {esVendedor ? 'Venta' : 'Compra'}
            </Badge>
          </div>
          <h3 className="text-sm md:text-base font-semibold text-gray-900 truncate pr-2">{transaccion.titulo_producto}</h3>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-2 md:gap-6 w-full md:w-auto pl-11 md:pl-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`font-normal border-0 text-[10px] md:text-xs px-2 py-0.5 md:py-1 ${config?.color.split(' ')[0]} ${config?.color.split(' ')[1]}`}>
            <IconComponent className="w-3 h-3 mr-1.5" />
            {config?.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-bold text-gray-900 text-sm md:text-base">
            S/ {transaccion.precio_producto.toFixed(2)}
          </p>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors hidden md:block" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
