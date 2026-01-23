import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  Calendar, 
  DollarSign,
  TrendingUp,
  Package,
  Users,
  PieChart
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';

interface ReportData {
  fecha: string;
  transacciones: number;
  volumen: number;
  comisiones: number;
  completadas: number;
  disputas: number;
}

export const AdminReports = () => {
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [periodo, setPeriodo] = useState('30');
  const [loading, setLoading] = useState(true);
  const [totales, setTotales] = useState({
    transacciones: 0,
    volumen: 0,
    comisiones: 0,
    completadas: 0,
    disputas: 0,
    tasaConversion: 0
  });

  useEffect(() => {
    fetchReportData();
  }, [periodo]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const diasAtras = parseInt(periodo);
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - diasAtras);

      const { data: transacciones } = await supabase
        .from('transacciones')
        .select('precio_producto, comision_bakan, estado, fecha_creacion')
        .gte('fecha_creacion', fechaInicio.toISOString());

      const { data: disputas } = await supabase
        .from('disputas')
        .select('fecha_apertura')
        .gte('fecha_apertura', fechaInicio.toISOString());

      // Group by date
      const dataByDate: Record<string, ReportData> = {};
      
      for (let i = 0; i < diasAtras; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dataByDate[dateStr] = {
          fecha: dateStr,
          transacciones: 0,
          volumen: 0,
          comisiones: 0,
          completadas: 0,
          disputas: 0
        };
      }

      transacciones?.forEach(tx => {
        const dateStr = tx.fecha_creacion?.split('T')[0];
        if (dateStr && dataByDate[dateStr]) {
          dataByDate[dateStr].transacciones++;
          dataByDate[dateStr].volumen += tx.precio_producto || 0;
          dataByDate[dateStr].comisiones += tx.comision_bakan || 0;
          if (tx.estado === 'completada') {
            dataByDate[dateStr].completadas++;
          }
        }
      });

      disputas?.forEach(d => {
        const dateStr = d.fecha_apertura?.split('T')[0];
        if (dateStr && dataByDate[dateStr]) {
          dataByDate[dateStr].disputas++;
        }
      });

      const sortedData = Object.values(dataByDate).sort((a, b) => 
        a.fecha.localeCompare(b.fecha)
      );

      setReportData(sortedData);

      // Calculate totals
      const totalTransacciones = transacciones?.length || 0;
      const totalCompletadas = transacciones?.filter(t => t.estado === 'completada').length || 0;
      
      setTotales({
        transacciones: totalTransacciones,
        volumen: transacciones?.reduce((acc, t) => acc + (t.precio_producto || 0), 0) || 0,
        comisiones: transacciones?.reduce((acc, t) => acc + (t.comision_bakan || 0), 0) || 0,
        completadas: totalCompletadas,
        disputas: disputas?.length || 0,
        tasaConversion: totalTransacciones > 0 ? Math.round((totalCompletadas / totalTransacciones) * 100) : 0
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Transacciones', 'Volumen', 'Comisiones', 'Completadas', 'Disputas'];
    const rows = reportData.map(d => [
      d.fecha,
      d.transacciones,
      d.volumen.toFixed(2),
      d.comisiones.toFixed(2),
      d.completadas,
      d.disputas
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-bakan-${periodo}dias.csv`;
    a.click();
  };

  const formatChartData = reportData.map(d => ({
    ...d,
    fechaCorta: new Date(d.fecha).toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short' 
    })
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reportes y Análisis</h2>
          <p className="text-muted-foreground">
            Estadísticas detalladas del sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="15">Últimos 15 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="60">Últimos 60 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col items-center text-center">
                  <Package className="w-8 h-8 text-blue-500 mb-2" />
                  <p className="text-xs text-muted-foreground">Transacciones</p>
                  <p className="text-2xl font-bold">{totales.transacciones}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col items-center text-center">
                  <DollarSign className="w-8 h-8 text-green-500 mb-2" />
                  <p className="text-xs text-muted-foreground">Volumen</p>
                  <p className="text-2xl font-bold">S/ {totales.volumen.toFixed(0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col items-center text-center">
                  <TrendingUp className="w-8 h-8 text-violet-500 mb-2" />
                  <p className="text-xs text-muted-foreground">Comisiones</p>
                  <p className="text-2xl font-bold">S/ {totales.comisiones.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col items-center text-center">
                  <Users className="w-8 h-8 text-emerald-500 mb-2" />
                  <p className="text-xs text-muted-foreground">Completadas</p>
                  <p className="text-2xl font-bold">{totales.completadas}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col items-center text-center">
                  <PieChart className="w-8 h-8 text-amber-500 mb-2" />
                  <p className="text-xs text-muted-foreground">Conversión</p>
                  <p className="text-2xl font-bold">{totales.tasaConversion}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col items-center text-center">
                  <Calendar className="w-8 h-8 text-red-500 mb-2" />
                  <p className="text-xs text-muted-foreground">Disputas</p>
                  <p className="text-2xl font-bold">{totales.disputas}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Evolución del Volumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formatChartData}>
                    <defs>
                      <linearGradient id="colorVolumenReport" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="fechaCorta" className="text-xs" />
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
                      stroke="#22c55e" 
                      fillOpacity={1} 
                      fill="url(#colorVolumenReport)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Transactions & Disputes Chart */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Transacciones por Día</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="fechaCorta" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="transacciones" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total" />
                      <Bar dataKey="completadas" fill="#22c55e" radius={[4, 4, 0, 0]} name="Completadas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comisiones Diarias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formatChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="fechaCorta" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`S/ ${value.toFixed(2)}`, 'Comisiones']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="comisiones" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
