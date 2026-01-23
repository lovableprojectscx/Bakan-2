import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { TransactionChat } from '@/components/transaction/TransactionChat';
import { TransactionWizardPanel } from '@/components/transaction/TransactionWizardPanel';
import { TransactionCodeShare } from '@/components/transaction/TransactionCodeShare';
import { TransactionDispute } from '@/components/transaction/TransactionDispute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Package, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Transaccion {
  id: string;
  codigo_invitacion: string;
  vendedor_id: string;
  comprador_id: string | null;
  titulo_producto: string;
  descripcion: string | null;
  precio_producto: number;
  comision_bakan: number;
  monto_a_liberar: number;
  tipo_producto: string;
  estado: string;
  fecha_creacion: string;
  fecha_pago: string | null;
  fecha_envio: string | null;
  fecha_liberacion: string | null;
  estado_pago_vendedor: string | null;
  voucher_pago_vendedor_url: string | null;
}

const Transaction = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [transaccion, setTransaccion] = useState<Transaccion | null>(null);
  const [loadingTransaccion, setLoadingTransaccion] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchTransaccion();
      
      const channel = supabase
        .channel(`transaction-${id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transacciones',
            filter: `id=eq.${id}`
          },
          () => {
            setTimeout(() => {
              fetchTransaccion();
            }, 0);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, id]);

  const fetchTransaccion = async () => {
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data.vendedor_id !== user?.id && data.comprador_id !== user?.id) {
        toast.error('No tienes acceso a esta transacción');
        navigate('/dashboard');
        return;
      }

      setTransaccion(data);
    } catch (error: any) {
      toast.error('Error al cargar la transacción: ' + error.message);
      navigate('/dashboard');
    } finally {
      setLoadingTransaccion(false);
    }
  };

  if (loading || loadingTransaccion || !user || !transaccion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando transacción...</p>
        </div>
      </div>
    );
  }

  const esVendedor = transaccion.vendedor_id === user.id;
  const esComprador = transaccion.comprador_id === user.id;
  const needsSecondParty = !transaccion.vendedor_id || !transaccion.comprador_id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        {/* Transaction Header - Compact */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">{transaccion.titulo_producto}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">{transaccion.codigo_invitacion}</span>
                <span>•</span>
                <Badge variant={esVendedor ? "default" : "secondary"} className="text-xs">
                  {esVendedor ? 'Vendedor' : 'Comprador'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">S/ {transaccion.precio_producto.toFixed(2)}</p>
          </div>
        </div>

        {/* Share code if needed */}
        {needsSecondParty && (
          <div className="mb-6">
            <TransactionCodeShare codigo={transaccion.codigo_invitacion} />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Wizard Panel - Main focus */}
          <div className="lg:col-span-2 space-y-4">
            <TransactionWizardPanel 
              transaccion={transaccion}
              esVendedor={esVendedor}
              esComprador={esComprador}
              onTransactionUpdate={fetchTransaccion}
            />
            
            {/* Dispute section - only show after payment confirmed */}
            {['pagada_retenida', 'enviado'].includes(transaccion.estado) && (
              <TransactionDispute
                transaccionId={transaccion.id}
                userId={user.id}
                estadoActual={transaccion.estado}
                onDisputeCreated={fetchTransaccion}
              />
            )}
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-3">
            {/* Mobile: Toggle button */}
            <div className="lg:hidden mb-4">
              <Button
                variant={showChat ? "default" : "outline"}
                className="w-full"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {showChat ? 'Ocultar Chat' : 'Ver Chat'}
              </Button>
            </div>

            {/* Chat card - always visible on desktop, toggle on mobile */}
            <Card className={`h-[500px] lg:h-[600px] flex flex-col overflow-hidden ${!showChat && 'hidden lg:flex'}`}>
              <CardHeader className="border-b p-4 flex-shrink-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Chat
                </CardTitle>
                <CardDescription className="text-xs">
                  Comunícate con {esVendedor ? 'el comprador' : 'el vendedor'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0 min-h-0">
                <TransactionChat 
                  transaccionId={transaccion.id}
                  userId={user.id}
                  estadoTransaccion={transaccion.estado}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Transaction;
