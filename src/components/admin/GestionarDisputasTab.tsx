import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle, Package, Phone, MessageSquare, User, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PerfilFinanciero {
  id: string;
  banco: string;
  numero_cuenta: string;
  tipo_cuenta: string;
  esta_activo: boolean;
}

interface Perfil {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  perfiles_financieros?: PerfilFinanciero[];
}

interface Mensaje {
  id: string;
  contenido: string;
  timestamp: string;
  emisor_id: string;
  tipo_mensaje: string;
}

interface Disputa {
  id: string;
  transaccion_id: string;
  reportante_id: string;
  motivo: string;
  estado_disputa: string;
  reembolso_estado: string;
  fecha_apertura: string;
  fecha_cierre?: string;
  resolucion_final?: string;
  reembolso_banco_comprador: string | null;
  reembolso_cuenta_comprador: string | null;
  transacciones: {
    codigo_invitacion: string;
    titulo_producto: string;
    precio_producto: number;
    comprador_id: string;
    vendedor_id: string;
  };
  comprador?: Perfil;
  vendedor?: Perfil;
  mensajes?: Mensaje[];
}

export const GestionarDisputasTab = ({ onUpdate }: { onUpdate: () => void }) => {
  const { user } = useAuth();
  const [disputas, setDisputas] = useState<Disputa[]>([]);
  const [disputasResueltas, setDisputasResueltas] = useState<Disputa[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [resolucion, setResolucion] = useState<Record<string, string>>({});
  const [subiendoVoucher, setSubiendoVoucher] = useState<string | null>(null);
  const [chatAbierto, setChatAbierto] = useState<string | null>(null);

  useEffect(() => {
    fetchDisputas();
    fetchDisputasResueltas();
  }, []);

  const fetchDisputas = async () => {
    try {
      const { data, error } = await supabase
        .from('disputas')
        .select('*')
        .in('estado_disputa', ['abierta', 'en_investigacion'])
        .order('fecha_apertura', { ascending: true });

      if (error) throw error;

      // Fetch transaction data, profiles, and messages separately
      const disputasConDatos = await Promise.all((data || []).map(async (disputa) => {
        const { data: transaccion } = await supabase
          .from('transacciones')
          .select('codigo_invitacion, titulo_producto, precio_producto, comprador_id, vendedor_id')
          .eq('id', disputa.transaccion_id)
          .single();

        if (!transaccion) {
          return {
            ...disputa,
            transacciones: { codigo_invitacion: '', titulo_producto: 'Sin título', precio_producto: 0, comprador_id: '', vendedor_id: '' }
          };
        }

        // Fetch buyer and seller profiles with financial profiles
        const { data: comprador } = await supabase
          .from('profiles')
          .select('id, nombre_completo, telefono')
          .eq('id', transaccion.comprador_id)
          .maybeSingle();

        const { data: vendedor } = await supabase
          .from('profiles')
          .select('id, nombre_completo, telefono')
          .eq('id', transaccion.vendedor_id)
          .maybeSingle();

        // Fetch financial profiles for both
        const { data: perfilesFinancierosComprador } = await supabase
          .from('perfiles_financieros')
          .select('id, banco, numero_cuenta, tipo_cuenta, esta_activo')
          .eq('usuario_id', transaccion.comprador_id)
          .eq('esta_activo', true);

        const { data: perfilesFinancierosVendedor } = await supabase
          .from('perfiles_financieros')
          .select('id, banco, numero_cuenta, tipo_cuenta, esta_activo')
          .eq('usuario_id', transaccion.vendedor_id)
          .eq('esta_activo', true);

        // Fetch messages
        const { data: mensajes } = await supabase
          .from('mensajes')
          .select('id, contenido, timestamp, emisor_id, tipo_mensaje')
          .eq('transaccion_id', disputa.transaccion_id)
          .order('timestamp', { ascending: true });

        return {
          ...disputa,
          transacciones: transaccion,
          comprador: comprador ? { ...comprador, perfiles_financieros: perfilesFinancierosComprador || [] } : undefined,
          vendedor: vendedor ? { ...vendedor, perfiles_financieros: perfilesFinancierosVendedor || [] } : undefined,
          mensajes: mensajes || []
        };
      }));

      setDisputas(disputasConDatos);
    } catch (error: any) {
      toast.error('Error al cargar disputas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputasResueltas = async () => {
    setLoadingHistorial(true);
    try {
      const { data, error } = await supabase
        .from('disputas')
        .select('*')
        .eq('estado_disputa', 'resuelta')
        .order('fecha_cierre', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch transaction data, profiles, and messages separately
      const disputasConDatos = await Promise.all((data || []).map(async (disputa) => {
        const { data: transaccion } = await supabase
          .from('transacciones')
          .select('codigo_invitacion, titulo_producto, precio_producto, comprador_id, vendedor_id')
          .eq('id', disputa.transaccion_id)
          .single();

        if (!transaccion) {
          return {
            ...disputa,
            transacciones: { codigo_invitacion: '', titulo_producto: 'Sin título', precio_producto: 0, comprador_id: '', vendedor_id: '' }
          };
        }

        const { data: comprador } = await supabase
          .from('profiles')
          .select('id, nombre_completo, telefono')
          .eq('id', transaccion.comprador_id)
          .maybeSingle();

        const { data: vendedor } = await supabase
          .from('profiles')
          .select('id, nombre_completo, telefono')
          .eq('id', transaccion.vendedor_id)
          .maybeSingle();

        // Fetch financial profiles for both
        const { data: perfilesFinancierosComprador } = await supabase
          .from('perfiles_financieros')
          .select('id, banco, numero_cuenta, tipo_cuenta, esta_activo')
          .eq('usuario_id', transaccion.comprador_id)
          .eq('esta_activo', true);

        const { data: perfilesFinancierosVendedor } = await supabase
          .from('perfiles_financieros')
          .select('id, banco, numero_cuenta, tipo_cuenta, esta_activo')
          .eq('usuario_id', transaccion.vendedor_id)
          .eq('esta_activo', true);

        const { data: mensajes } = await supabase
          .from('mensajes')
          .select('id, contenido, timestamp, emisor_id, tipo_mensaje')
          .eq('transaccion_id', disputa.transaccion_id)
          .order('timestamp', { ascending: true });

        return {
          ...disputa,
          transacciones: transaccion,
          comprador: comprador ? { ...comprador, perfiles_financieros: perfilesFinancierosComprador || [] } : undefined,
          vendedor: vendedor ? { ...vendedor, perfiles_financieros: perfilesFinancierosVendedor || [] } : undefined,
          mensajes: mensajes || []
        };
      }));

      setDisputasResueltas(disputasConDatos);
    } catch (error: any) {
      toast.error('Error al cargar historial: ' + error.message);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const marcarEnInvestigacion = async (disputaId: string) => {
    setProcesando(disputaId);
    try {
      const { error } = await supabase
        .from('disputas')
        .update({ estado_disputa: 'en_investigacion' })
        .eq('id', disputaId);

      if (error) throw error;

      toast.success('Disputa marcada como en investigación');
      fetchDisputas();
      onUpdate();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setProcesando(null);
    }
  };

  const resolverDisputa = async (disputaId: string, favorComprador: boolean) => {
    if (!resolucion[disputaId]) {
      toast.error('Debes escribir una resolución');
      return;
    }

    setProcesando(disputaId);
    try {
      const disputa = disputas.find(d => d.id === disputaId);
      if (!disputa) return;

      // Update disputa with fecha_cierre
      const { error: updateError } = await supabase
        .from('disputas')
        .update({
          estado_disputa: 'resuelta',
          resolucion_final: resolucion[disputaId],
          reembolso_estado: favorComprador ? 'pendiente_devolucion' : 'completado',
          fecha_cierre: new Date().toISOString()
        })
        .eq('id', disputaId);

      if (updateError) throw updateError;

      // Update transaction
      const { error: txError } = await supabase
        .from('transacciones')
        .update({
          estado: favorComprador ? 'cancelada' : 'completada',
          admin_id_mediador: user?.id
        })
        .eq('id', disputa.transaccion_id);

      if (txError) throw txError;

      // Log admin action
      await supabase
        .from('registros_admin')
        .insert({
          admin_id: user?.id,
          transaccion_id: disputa.transaccion_id,
          accion_realizada: `Resolvió disputa a favor del ${favorComprador ? 'comprador' : 'vendedor'}`
        });

      // Send system message
      await supabase
        .from('mensajes')
        .insert({
          transaccion_id: disputa.transaccion_id,
          emisor_id: user?.id,
          contenido: `⚖️ Disputa resuelta: ${resolucion[disputaId]}`,
          tipo_mensaje: 'sistema_admin'
        });

      toast.success('Disputa resuelta exitosamente');
      fetchDisputas();
      fetchDisputasResueltas();
      onUpdate();
    } catch (error: any) {
      toast.error('Error al resolver disputa: ' + error.message);
    } finally {
      setProcesando(null);
    }
  };

  const subirVoucherReembolso = async (disputaId: string, file: File) => {
    setSubiendoVoucher(disputaId);
    try {
      const disputa = disputas.find(d => d.id === disputaId) || disputasResueltas.find(d => d.id === disputaId);
      if (!disputa) return;

      // Upload voucher
      const fileExt = file.name.split('.').pop();
      const fileName = `admin/reembolsos/${disputaId}/reembolso-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('vouchers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Store file path (not public URL) for private bucket
      // Update disputa with file path

      const { error: updateError } = await supabase
        .from('disputas')
        .update({
          reembolso_voucher_url: fileName, // Store path, not public URL
          reembolso_estado: 'completado'
        })
        .eq('id', disputaId);

      if (updateError) throw updateError;

      toast.success('Voucher de reembolso subido exitosamente');
      fetchDisputas();
      onUpdate();
    } catch (error: any) {
      toast.error('Error al subir voucher: ' + error.message);
    } finally {
      setSubiendoVoucher(null);
    }
  };

  const renderDisputa = (disputa: Disputa, esHistorial = false) => (
    <Card key={disputa.id} className={`border-2 ${esHistorial ? 'border-muted' : 'border-destructive/20'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {esHistorial ? <History className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5 text-destructive" />}
              {disputa.transacciones.titulo_producto}
            </CardTitle>
            <CardDescription>
              Código: {disputa.transacciones.codigo_invitacion}
            </CardDescription>
          </div>
          <Badge variant={esHistorial ? 'secondary' : 'destructive'}>{disputa.estado_disputa}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-semibold text-sm mb-2">Motivo:</p>
          <p className="text-sm bg-muted p-3 rounded">{disputa.motivo}</p>
        </div>

        {esHistorial && disputa.resolucion_final && (
          <>
            <div>
              <p className="font-semibold text-sm mb-2">Resolución:</p>
              <p className="text-sm bg-green-50 dark:bg-green-950/20 p-3 rounded border border-green-200">
                {disputa.resolucion_final}
              </p>
            </div>
            
            {/* Clear Payment Indicator */}
            <div className={`p-4 rounded-lg border-2 ${
              disputa.reembolso_estado === 'pendiente_devolucion' || disputa.reembolso_estado === 'pendiente'
                ? 'bg-green-100 dark:bg-green-900/30 border-green-500'
                : 'bg-purple-100 dark:bg-purple-900/30 border-purple-500'
            }`}>
              <p className="font-bold text-lg mb-2">
                {disputa.reembolso_estado === 'pendiente_devolucion' || disputa.reembolso_estado === 'pendiente'
                  ? '💰 DEBES PAGAR AL COMPRADOR (Reembolso)'
                  : '✅ DEBES PAGAR AL VENDEDOR (Liberar fondos)'
                }
              </p>
              <p className="text-sm font-semibold">
                {disputa.reembolso_estado === 'pendiente_devolucion' || disputa.reembolso_estado === 'pendiente'
                  ? `Beneficiario: ${disputa.comprador?.nombre_completo || 'Comprador'}`
                  : `Beneficiario: ${disputa.vendedor?.nombre_completo || 'Vendedor'}`
                }
              </p>
            </div>
          </>
        )}

        <div className="text-sm text-muted-foreground">
          {esHistorial ? (
            <>
              Resuelta: {disputa.fecha_cierre ? new Date(disputa.fecha_cierre).toLocaleString('es-ES') : 'N/A'}
            </>
          ) : (
            <>
              Reportada: {new Date(disputa.fecha_apertura).toLocaleString('es-ES')}
            </>
          )}
        </div>

        {/* Buyer and Seller Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
          <div className="bg-muted p-3 rounded">
            <p className="font-semibold text-sm mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Comprador
            </p>
            {disputa.comprador ? (
              <>
                <p className="text-sm">
                  <span className="font-semibold">Nombre:</span> {disputa.comprador.nombre_completo}
                </p>
                {disputa.comprador.telefono && (
                  <p className="text-sm flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span className="font-semibold">Tel:</span> {disputa.comprador.telefono}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sin información</p>
            )}
          </div>

          <div className="bg-muted p-3 rounded">
            <p className="font-semibold text-sm mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Vendedor
            </p>
            {disputa.vendedor ? (
              <>
                <p className="text-sm">
                  <span className="font-semibold">Nombre:</span> {disputa.vendedor.nombre_completo}
                </p>
                {disputa.vendedor.telefono && (
                  <p className="text-sm flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span className="font-semibold">Tel:</span> {disputa.vendedor.telefono}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sin información</p>
            )}
          </div>
        </div>

        {/* View Chat Button */}
        <Button
          variant="outline"
          onClick={() => setChatAbierto(disputa.id)}
          className="w-full"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Ver Chat de la Transacción ({disputa.mensajes?.length || 0} mensajes)
        </Button>

        {/* Financial Information for both parties */}
        <div className="space-y-3 pt-2 border-t">
          <p className="font-semibold text-sm">💰 Datos Bancarios para Pagos/Reembolsos:</p>
          
          {/* Buyer Financial Info */}
          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded border border-green-200">
            <p className="font-semibold text-sm mb-2 text-green-700 dark:text-green-400">
              Datos del Comprador {disputa.comprador?.nombre_completo && `(${disputa.comprador.nombre_completo})`}
            </p>
            {disputa.reembolso_banco_comprador ? (
              <div className="text-sm space-y-1">
                <p><span className="font-semibold">Banco:</span> {disputa.reembolso_banco_comprador}</p>
                <p><span className="font-semibold">Cuenta:</span> {disputa.reembolso_cuenta_comprador}</p>
                <p className="text-xs text-muted-foreground italic mt-1">Datos proporcionados en la disputa</p>
              </div>
            ) : disputa.comprador?.perfiles_financieros && disputa.comprador.perfiles_financieros.length > 0 ? (
              <div className="text-sm space-y-2">
                {disputa.comprador.perfiles_financieros.map((perfil) => (
                  <div key={perfil.id} className="bg-white/50 dark:bg-black/20 p-2 rounded">
                    <p><span className="font-semibold">Banco:</span> {perfil.banco}</p>
                    <p><span className="font-semibold">Cuenta:</span> {perfil.numero_cuenta}</p>
                    <p><span className="font-semibold">Tipo:</span> {perfil.tipo_cuenta}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay datos bancarios registrados</p>
            )}
          </div>

          {/* Seller Financial Info */}
          <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded border border-purple-200">
            <p className="font-semibold text-sm mb-2 text-purple-700 dark:text-purple-400">
              Datos del Vendedor {disputa.vendedor?.nombre_completo && `(${disputa.vendedor.nombre_completo})`}
            </p>
            {disputa.vendedor?.perfiles_financieros && disputa.vendedor.perfiles_financieros.length > 0 ? (
              <div className="text-sm space-y-2">
                {disputa.vendedor.perfiles_financieros.map((perfil) => (
                  <div key={perfil.id} className="bg-white/50 dark:bg-black/20 p-2 rounded">
                    <p><span className="font-semibold">Banco:</span> {perfil.banco}</p>
                    <p><span className="font-semibold">Cuenta:</span> {perfil.numero_cuenta}</p>
                    <p><span className="font-semibold">Tipo:</span> {perfil.tipo_cuenta}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay datos bancarios registrados</p>
            )}
          </div>

          {!esHistorial && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-2 rounded text-xs text-blue-700 dark:text-blue-400">
              💡 <span className="font-semibold">Nota:</span> Si resuelves a favor del comprador, usa sus datos para el reembolso. Si resuelves a favor del vendedor, usa sus datos para liberar el pago.
            </div>
          )}
        </div>

        {!esHistorial && disputa.estado_disputa === 'abierta' && (
          <Button
            variant="secondary"
            onClick={() => marcarEnInvestigacion(disputa.id)}
            disabled={procesando === disputa.id}
            className="w-full"
          >
            Marcar como En Investigación
          </Button>
        )}

        {!esHistorial && disputa.estado_disputa === 'en_investigacion' && (
          <div className="space-y-3 pt-4 border-t">
            <div>
              <Label htmlFor={`resolucion-${disputa.id}`}>Resolución Final</Label>
              <Textarea
                id={`resolucion-${disputa.id}`}
                placeholder="Describe la resolución de la disputa..."
                value={resolucion[disputa.id] || ''}
                onChange={(e) => setResolucion({ ...resolucion, [disputa.id]: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={() => resolverDisputa(disputa.id, true)}
                disabled={procesando === disputa.id}
                className="flex-1"
              >
                Resolver a favor del Comprador (Reembolsar)
              </Button>
              <Button
                onClick={() => resolverDisputa(disputa.id, false)}
                disabled={procesando === disputa.id}
                className="flex-1"
              >
                Resolver a favor del Vendedor
              </Button>
            </div>
          </div>
        )}

        {!esHistorial && disputa.reembolso_estado === 'pendiente_devolucion' && (
          <div className="space-y-3 pt-4 border-t">
            <Label htmlFor={`voucher-reembolso-${disputa.id}`}>
              Subir Voucher de Reembolso
            </Label>
            <Input
              id={`voucher-reembolso-${disputa.id}`}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) subirVoucherReembolso(disputa.id, file);
              }}
              disabled={subiendoVoucher === disputa.id}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="activas" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="activas">
          Disputas Activas ({disputas.length})
        </TabsTrigger>
        <TabsTrigger value="historial">
          Historial ({disputasResueltas.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="activas" className="space-y-4 mt-4">
        {disputas.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Todo al día</h3>
            <p className="text-muted-foreground">
              No hay disputas abiertas
            </p>
          </div>
        ) : (
          disputas.map((disputa) => renderDisputa(disputa, false))
        )}
      </TabsContent>

      <TabsContent value="historial" className="space-y-4 mt-4">
        {loadingHistorial ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : disputasResueltas.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sin historial</h3>
            <p className="text-muted-foreground">
              No hay disputas resueltas aún
            </p>
          </div>
        ) : (
          disputasResueltas.map((disputa) => renderDisputa(disputa, true))
        )}
      </TabsContent>

      {/* Chat Dialog */}
      <Dialog open={!!chatAbierto} onOpenChange={(open) => !open && setChatAbierto(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Chat de la Transacción</DialogTitle>
            <DialogDescription>
              Historial completo de mensajes
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {chatAbierto && [...disputas, ...disputasResueltas].find(d => d.id === chatAbierto)?.mensajes?.map((mensaje) => {
                const disputa = [...disputas, ...disputasResueltas].find(d => d.id === chatAbierto);
                const esComprador = mensaje.emisor_id === disputa?.transacciones.comprador_id;
                const esVendedor = mensaje.emisor_id === disputa?.transacciones.vendedor_id;
                const esSistema = mensaje.tipo_mensaje.includes('sistema');

                return (
                  <div
                    key={mensaje.id}
                    className={`p-3 rounded-lg ${
                      esSistema
                        ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200'
                        : esComprador
                        ? 'bg-green-50 dark:bg-green-950/20'
                        : 'bg-purple-50 dark:bg-purple-950/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">
                        {esSistema
                          ? '🤖 Sistema'
                          : esComprador
                          ? `👤 ${disputa?.comprador?.nombre_completo || 'Comprador'}`
                          : `👤 ${disputa?.vendedor?.nombre_completo || 'Vendedor'}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(mensaje.timestamp).toLocaleString('es-ES')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{mensaje.contenido}</p>
                  </div>
                );
              })}
              {chatAbierto && (!([...disputas, ...disputasResueltas].find(d => d.id === chatAbierto)?.mensajes?.length)) && (
                <p className="text-center text-muted-foreground py-8">No hay mensajes</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};
