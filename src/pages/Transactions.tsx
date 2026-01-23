import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Package,
    Clock,
    CheckCircle,
    AlertCircle,
    Shield,
    ArrowLeft,
    Search,
    ArrowRight,
    Filter
} from 'lucide-react';
import { toast } from 'sonner';

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

const Transactions = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
    const [loadingTransacciones, setLoadingTransacciones] = useState(true);
    const [filter, setFilter] = useState('todos');

    useEffect(() => {
        if (!loading && !user) {
            navigate('/auth');
        }
    }, [user, loading, navigate]);

    useEffect(() => {
        if (user) {
            fetchTransacciones();
        }
    }, [user]);

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

    const filteredTransacciones = transacciones.filter(t => {
        if (filter === 'todos') return true;
        if (filter === 'ventas') return t.vendedor_id === user?.id;
        if (filter === 'compras') return t.comprador_id === user?.id;
        if (filter === 'finalizadas') return ['completada', 'cancelada', 'cancelada_automatico'].includes(t.estado);
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Header />

            <main className="container mx-auto px-4 sm:px-6 pt-24 md:pt-28 pb-12 animate-fade-in">

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="p-0 hover:bg-transparent text-gray-400 hover:text-gray-900 -ml-2 h-auto"
                                onClick={() => navigate('/dashboard')}
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Volver
                            </Button>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                            Historial de Transacciones
                        </h1>
                        <p className="text-sm md:text-base text-gray-500 mt-1">
                            Registro completo de tus operaciones en Bakan.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="bg-white" onClick={fetchTransacciones}>
                            Actualizar
                        </Button>
                    </div>
                </div>

                {/* Filters & Content */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-gray-200">
                        <Tabs defaultValue="todos" className="w-full" onValueChange={setFilter}>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <TabsList className="bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                                    <TabsTrigger value="todos" className="flex-1 md:flex-none">Todas</TabsTrigger>
                                    <TabsTrigger value="ventas" className="flex-1 md:flex-none">Ventas</TabsTrigger>
                                    <TabsTrigger value="compras" className="flex-1 md:flex-none">Compras</TabsTrigger>
                                    <TabsTrigger value="finalizadas" className="flex-1 md:flex-none">Finalizadas</TabsTrigger>
                                </TabsList>
                            </div>
                        </Tabs>
                    </div>

                    <div className="p-0">
                        {/* Desktop Table View */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                        <TableHead className="w-[100px]">Código</TableHead>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Rol</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingTransacciones ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                Cargando...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredTransacciones.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                                                No se encontraron transacciones.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTransacciones.map((t) => {
                                            const esVendedor = t.vendedor_id === user?.id;
                                            const config = estadoConfig[t.estado as keyof typeof estadoConfig];
                                            const date = new Date(t.fecha_creacion).toLocaleDateString('es-PE', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            });

                                            return (
                                                <TableRow
                                                    key={t.id}
                                                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                                                    onClick={() => navigate(`/transaction/${t.id}`)}
                                                >
                                                    <TableCell className="font-mono text-xs text-gray-500">
                                                        {t.codigo_invitacion}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-gray-900">
                                                        {t.titulo_producto}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className={`font-normal ${esVendedor ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                            {esVendedor ? 'Venta' : 'Compra'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-gray-500 text-sm">
                                                        {date}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={`font-normal border-0 ${config?.color.split(' ')[0]} ${config?.color.split(' ')[1]}`}>
                                                            {config?.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-gray-900">
                                                        S/ {t.precio_producto.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <ArrowRight className="w-4 h-4 text-gray-300" />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile List View */}
                        <div className="md:hidden">
                            {loadingTransacciones ? (
                                <div className="p-8 text-center text-gray-500">Cargando...</div>
                            ) : filteredTransacciones.length === 0 ? (
                                <div className="p-12 text-center border-dashed border-gray-200">
                                    <p className="text-gray-500 text-sm">No se encontraron transacciones.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {filteredTransacciones.map((t) => (
                                        <MobileTransactionCard key={t.id} transaccion={t} userId={user?.id || ''} navigate={navigate} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const MobileTransactionCard = ({ transaccion, userId, navigate }: { transaccion: Transaccion; userId: string; navigate: (path: string) => void }) => {
    const esVendedor = transaccion.vendedor_id === userId;
    const config = estadoConfig[transaccion.estado as keyof typeof estadoConfig];
    const IconComponent = config?.icon || Clock;
    const date = new Date(transaccion.fecha_creacion).toLocaleDateString('es-PE', {
        day: '2-digit', month: 'short'
    });

    return (
        <div
            className="p-4 bg-white active:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => navigate(`/transaction/${transaccion.id}`)}
        >
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-[10px] h-5 px-1.5 font-normal ${esVendedor ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {esVendedor ? 'Venta' : 'Compra'}
                    </Badge>
                    <span className="text-[10px] text-gray-400 font-mono">{transaccion.codigo_invitacion}</span>
                </div>
                <span className="text-xs text-gray-400">{date}</span>
            </div>

            <div className="flex items-center justify-between gap-4 mb-2">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{transaccion.titulo_producto}</h3>
                <span className="font-bold text-gray-900 text-sm whitespace-nowrap">S/ {transaccion.precio_producto.toFixed(2)}</span>
            </div>

            <div className="flex items-center">
                <Badge variant="outline" className={`font-normal border-0 text-[10px] px-1.5 py-0 ${config?.color.split(' ')[0]} ${config?.color.split(' ')[1]}`}>
                    <IconComponent className="w-3 h-3 mr-1" />
                    {config?.label}
                </Badge>
            </div>
        </div>
    );
};

export default Transactions;
