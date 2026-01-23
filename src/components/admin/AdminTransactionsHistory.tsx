import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Package, 
  User,
  Calendar,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';

interface Transaccion {
  id: string;
  codigo_invitacion: string;
  titulo_producto: string;
  precio_producto: number;
  comision_bakan: number;
  monto_a_liberar: number;
  estado: string;
  tipo_producto: string;
  fecha_creacion: string;
  fecha_pago: string | null;
  fecha_envio: string | null;
  fecha_liberacion: string | null;
  vendedor_id: string;
  comprador_id: string;
  vendedor?: { nombre_completo: string };
  comprador?: { nombre_completo: string };
}

const estadoColors: Record<string, string> = {
  'iniciada': 'bg-gray-500',
  'pendiente_pago': 'bg-yellow-500',
  'pago_en_verificacion': 'bg-orange-500',
  'pagada_retenida': 'bg-blue-500',
  'enviado': 'bg-purple-500',
  'completada': 'bg-green-500',
  'en_disputa': 'bg-red-500',
  'cancelada': 'bg-gray-700',
  'cancelada_automatico': 'bg-gray-600'
};

const estadoLabels: Record<string, string> = {
  'iniciada': 'Iniciada',
  'pendiente_pago': 'Pendiente Pago',
  'pago_en_verificacion': 'En Verificación',
  'pagada_retenida': 'Pagada',
  'enviado': 'Enviado',
  'completada': 'Completada',
  'en_disputa': 'En Disputa',
  'cancelada': 'Cancelada',
  'cancelada_automatico': 'Cancelada Auto'
};

export const AdminTransactionsHistory = () => {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransacciones();
  }, []);

  const fetchTransacciones = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .order('fecha_creacion', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Fetch profiles for each transaction
      const transaccionesConPerfiles = await Promise.all((data || []).map(async (tx) => {
        const [vendedorResult, compradorResult] = await Promise.all([
          tx.vendedor_id 
            ? supabase.from('profiles').select('nombre_completo').eq('id', tx.vendedor_id).maybeSingle()
            : Promise.resolve({ data: null }),
          tx.comprador_id
            ? supabase.from('profiles').select('nombre_completo').eq('id', tx.comprador_id).maybeSingle()
            : Promise.resolve({ data: null })
        ]);

        return {
          ...tx,
          vendedor: vendedorResult.data,
          comprador: compradorResult.data
        };
      }));

      setTransacciones(transaccionesConPerfiles);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransacciones = transacciones.filter(tx => {
    const matchesSearch = 
      tx.codigo_invitacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.titulo_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.vendedor?.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.comprador?.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado = estadoFilter === 'all' || tx.estado === estadoFilter;

    return matchesSearch && matchesEstado;
  });

  const stats = {
    total: filteredTransacciones.length,
    volumen: filteredTransacciones.reduce((acc, tx) => acc + tx.precio_producto, 0),
    comisiones: filteredTransacciones.reduce((acc, tx) => acc + tx.comision_bakan, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Historial de Transacciones</h2>
          <p className="text-muted-foreground">
            Todas las transacciones del sistema
          </p>
        </div>
        <Button onClick={fetchTransacciones} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, producto o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(estadoLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Transacciones</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Volumen</p>
                <p className="text-2xl font-bold">S/ {stats.volumen.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-violet-500" />
              <div>
                <p className="text-sm text-muted-foreground">Comisiones</p>
                <p className="text-2xl font-bold">S/ {stats.comisiones.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransacciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No hay transacciones</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransacciones.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">
                          {tx.codigo_invitacion}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate max-w-[200px]">{tx.titulo_producto}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="text-sm">{tx.vendedor?.nombre_completo || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="text-sm">{tx.comprador?.nombre_completo || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          S/ {tx.precio_producto.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          S/ {tx.comision_bakan.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`${estadoColors[tx.estado] || 'bg-gray-500'} text-white text-xs`}
                          >
                            {estadoLabels[tx.estado] || tx.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(tx.fecha_creacion).toLocaleDateString('es-ES')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/transaction/${tx.id}`)}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
