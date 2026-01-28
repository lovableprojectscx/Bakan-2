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
import { ArrowLeft, Package, MessageCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Transaccion {
  id: string;
  codigo_invitacion: string;
  vendedor_id: string;
  comprador_id: string | null;
  solicitud_cancelacion_por?: string | null;
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
        .channel(`transaction - ${id} `)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transacciones',
            filter: `id = eq.${id} `
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
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background flex flex-col relative overflow-hidden">
      {/* Background decor */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-[20%] left-[-150px] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <Header />
      <main className="container mx-auto px-0 sm:px-4 pt-24 pb-32 max-w-xl flex-1 flex flex-col justify-start min-h-[calc(100vh-64px)] z-10">
        {/* Back Button - Absolute on mobile, inline on desktop */}
        {/* Back Button - Floating style */}
        <div className="absolute top-20 left-4 z-40 md:static md:mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 md:h-9 md:w-auto md:px-4 rounded-full bg-white/60 dark:bg-black/30 backdrop-blur-md md:shadow-none md:border-0 md:bg-transparent transition-all hover:bg-white dark:hover:bg-black/50"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-5 h-5 md:mr-2 md:w-4 md:h-4 text-foreground/80" />
            <span className="hidden md:inline font-medium">Volver</span>
          </Button>
        </div>

        {/* Transaction Header - Premium Card Style */}
        <div className="mx-4 sm:mx-0 mb-3 mt-4 sm:mt-0 p-4 bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-2xl border border-black/5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Badge variant={esVendedor ? "default" : "secondary"} className="rounded-full px-2 py-0.5 text-[9px] font-black tracking-widest uppercase shadow-sm">
                  {esVendedor ? 'Tu Venta' : 'Tu Compra'}
                </Badge>
                <span className="text-[9px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded border border-border/20">#{transaccion.codigo_invitacion}</span>
              </div>
              <h1 className="font-bold text-lg tracking-tight text-foreground leading-tight">
                {transaccion.titulo_producto}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground font-medium mb-0.5">
                {esVendedor ? 'Recibirás' : 'Total a Pagar'}
              </p>
              <p className={cn(
                "text-2xl font-black tracking-tight",
                esVendedor ? "text-success" : "text-primary"
              )}>
                S/ {esVendedor
                  ? transaccion.monto_a_liberar.toFixed(2)
                  : (transaccion.precio_producto + transaccion.comision_bakan).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Centered */}
        <div className="max-w-3xl mx-auto">
          {/* Wizard Panel - Main focus */}
          <div className="space-y-4">
            {needsSecondParty && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
                <TransactionCodeShare
                  codigo={transaccion.codigo_invitacion}
                  monto={transaccion.precio_producto}
                  titulo={transaccion.titulo_producto}
                />
              </div>
            )}

            {transaccion && (
              <TransactionWizardPanel
                transaccion={transaccion}
                esVendedor={esVendedor}
                esComprador={esComprador}
                onTransactionUpdate={fetchTransaccion}
              />
            )}

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
        </div>

        {/* Floating Chat Widget */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">

          {/* Chat Window */}
          {showChat && (
            <Card className="w-[350px] sm:w-[380px] h-[500px] shadow-2xl border-primary/20 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-auto">
              <CardHeader className="border-b p-3 bg-primary/5 flex flex-row items-center justify-between space-y-0 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-full">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Chat de Transacción</CardTitle>
                    <CardDescription className="text-xs">
                      {esVendedor ? 'Con el comprador' : 'Con el vendedor'}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-black/5"
                  onClick={() => setShowChat(false)}
                >
                  <span className="sr-only">Cerrar</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-0 min-h-0 bg-background/50 backdrop-blur-sm">
                <TransactionChat
                  transaccionId={transaccion.id}
                  userId={user.id}
                  estadoTransaccion={transaccion.estado}
                />
              </CardContent>
            </Card>
          )}

          {/* Toggle Button */}
          <Button
            onClick={() => setShowChat(!showChat)}
            size="lg"
            className={`h - 14 rounded - full shadow - lg pointer - events - auto transition - all duration - 300 hover: scale - 105 ${showChat ? 'bg-destructive hover:bg-destructive/90 px-4' : 'bg-primary hover:bg-primary/90 px-6'} `}
          >
            {showChat ? (
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                <span className="font-semibold text-base hidden sm:inline">Cerrar</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                <span className="font-semibold text-base">Chat de Transacción</span>
              </div>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Transaction;
