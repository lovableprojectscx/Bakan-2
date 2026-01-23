import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface DashboardStats {
  totalTransacciones: number;
  volumenTotal: number;
  comisionesTotal: number;
  usuariosActivos: number;
  transaccionesHoy: number;
  volumenHoy: number;
  disputasActivas: number;
  tasaExito: number;
}

interface ChartData {
  fecha: string;
  transacciones: number;
  volumen: number;
  comisiones: number;
}

interface EstadoData {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTransacciones: 0,
    volumenTotal: 0,
    comisionesTotal: 0,
    usuariosActivos: 0,
    transaccionesHoy: 0,
    volumenHoy: 0,
    disputasActivas: 0,
    tasaExito: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [estadosData, setEstadosData] = useState<EstadoData[]>([]);
  const [actividadReciente, setActividadReciente] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch general stats
      const { data: transacciones } = await supabase
        .from('transacciones')
        .select('precio_producto, comision_bakan, estado, fecha_creacion');

      const { count: usuariosCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: disputasCount } = await supabase
        .from('disputas')
        .select('*', { count: 'exact', head: true })
        .in('estado_disputa', ['abierta', 'en_investigacion']);

      // Calculate stats
      const hoy = new Date().toISOString().split('T')[0];
      const transaccionesHoy = transacciones?.filter(t => 
        t.fecha_creacion?.startsWith(hoy)
      ) || [];

      const completadas = transacciones?.filter(t => t.estado === 'completada') || [];
      const tasaExito = transacciones && transacciones.length > 0 
        ? (completadas.length / transacciones.length) * 100 
        : 0;

      setStats({
        totalTransacciones: transacciones?.length || 0,
        volumenTotal: transacciones?.reduce((acc, t) => acc + (t.precio_producto || 0), 0) || 0,
        comisionesTotal: transacciones?.reduce((acc, t) => acc + (t.comision_bakan || 0), 0) || 0,
        usuariosActivos: usuariosCount || 0,
        transaccionesHoy: transaccionesHoy.length,
        volumenHoy: transaccionesHoy.reduce((acc, t) => acc + (t.precio_producto || 0), 0),
        disputasActivas: disputasCount || 0,
        tasaExito: Math.round(tasaExito)
      });

      // Prepare chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const chartDataPrepared = last7Days.map(fecha => {
        const dayTransactions = transacciones?.filter(t => 
          t.fecha_creacion?.startsWith(fecha)
        ) || [];
        return {
          fecha: new Date(fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
          transacciones: dayTransactions.length,
          volumen: dayTransactions.reduce((acc, t) => acc + (t.precio_producto || 0), 0),
          comisiones: dayTransactions.reduce((acc, t) => acc + (t.comision_bakan || 0), 0)
        };
      });

      setChartData(chartDataPrepared);

      // Prepare estados data
      const estadosCounts: Record<string, number> = {};
      transacciones?.forEach(t => {
        const estado = t.estado || 'desconocido';
        estadosCounts[estado] = (estadosCounts[estado] || 0) + 1;
      });

      const estadosLabels: Record<string, string> = {
        'iniciada': 'Iniciada',
        'pendiente_pago': 'Pendiente Pago',
        'pago_en_verificacion': 'En Verificación',
        'pagada_retenida': 'Pagada',
        'enviado': 'Enviado',
        'completada': 'Completada',
        'en_disputa': 'En Disputa',
        'cancelada': 'Cancelada'
      };

      const estadosPreparados = Object.entries(estadosCounts).map(([estado, count], index) => ({
        name: estadosLabels[estado] || estado,
        value: count,
        color: COLORS[index % COLORS.length]
      }));

      setEstadosData(estadosPreparados);

      // Fetch recent activity
      const { data: actividadData } = await supabase
        .from('registros_admin')
        .select('*, profiles:admin_id(nombre_completo)')
        .order('timestamp', { ascending: false })
        .limit(10);

      setActividadReciente(actividadData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Vista general del sistema Bakan
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Volumen Total</CardTitle>
            <DollarSign className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {stats.volumenTotal.toFixed(2)}</div>
            <div className="flex items-center gap-1 text-xs text-white/80 mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+{stats.transaccionesHoy} transacciones hoy</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Comisiones</CardTitle>
            <TrendingUp className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {stats.comisionesTotal.toFixed(2)}</div>
            <div className="flex items-center gap-1 text-xs text-white/80 mt-1">
              <Activity className="h-3 w-3" />
              <span>Ingresos acumulados</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usuariosActivos}</div>
            <div className="flex items-center gap-1 text-xs text-white/80 mt-1">
              <CheckCircle className="h-3 w-3" />
              <span>Usuarios registrados</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Tasa de Éxito</CardTitle>
            <Package className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasaExito}%</div>
            <div className="flex items-center gap-1 text-xs text-white/80 mt-1">
              <ArrowUpRight className="h-3 w-3" />
              <span>{stats.totalTransacciones} transacciones totales</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transaccionesHoy}</div>
            <p className="text-xs text-muted-foreground">
              S/ {stats.volumenHoy.toFixed(2)} en volumen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Disputas Activas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.disputasActivas}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/ {stats.totalTransacciones > 0 ? (stats.volumenTotal / stats.totalTransacciones).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Por transacción
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Volume Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Volumen Últimos 7 Días</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVolumen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="fecha" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`S/ ${value.toFixed(2)}`, 'Volumen']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="volumen" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorVolumen)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Estados Pie Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estadosData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {estadosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones por Día</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="fecha" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="transacciones" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente del Admin</CardTitle>
        </CardHeader>
        <CardContent>
          {actividadReciente.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay actividad registrada
            </p>
          ) : (
            <div className="space-y-3">
              {actividadReciente.map((actividad) => (
                <div 
                  key={actividad.id} 
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {actividad.accion_realizada}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(actividad.timestamp).toLocaleString('es-ES')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {actividad.profiles?.nombre_completo || 'Admin'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
