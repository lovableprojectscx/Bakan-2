import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ExternalLink, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Transaccion {
  id: string;
  codigo_invitacion: string;
  titulo_producto: string;
  precio_producto: number;
  comprador_id: string;
  vendedor_id: string;
  fecha_pago: string;
}

interface Prueba {
  id: string;
  url_archivo: string;
  descripcion: string;
  fecha_carga: string;
}

export const VerificarPagosTab = ({ onUpdate }: { onUpdate: () => void }) => {
  const { user } = useAuth();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [pruebas, setPruebas] = useState<Record<string, Prueba[]>>({});
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);

  useEffect(() => {
    fetchTransacciones();
  }, []);

  const fetchTransacciones = async () => {
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .eq('estado', 'pago_en_verificacion')
        .order('fecha_pago', { ascending: true });

      if (error) throw error;
      setTransacciones(data || []);

      // Fetch pruebas for each transaction
      if (data && data.length > 0) {
        const pruebasData: Record<string, Prueba[]> = {};
        for (const tx of data) {
          const { data: pruebasTransaccion } = await supabase
            .from('pruebas_transaccion')
            .select('*')
            .eq('transaccion_id', tx.id)
            .eq('tipo_prueba', 'voucher_pago');
          
          if (pruebasTransaccion) {
            pruebasData[tx.id] = pruebasTransaccion;
          }
        }
        setPruebas(pruebasData);
      }
    } catch (error: any) {
      toast.error('Error al cargar transacciones: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmarPago = async (transaccionId: string) => {
    setProcesando(transaccionId);
    try {
      // Update transaction status
      const { error: updateError } = await supabase
        .from('transacciones')
        .update({
          estado: 'pagada_retenida',
          admin_id_verificador: user?.id
        })
        .eq('id', transaccionId);

      if (updateError) throw updateError;

      // Log admin action
      await supabase
        .from('registros_admin')
        .insert({
          admin_id: user?.id,
          transaccion_id: transaccionId,
          accion_realizada: 'Confirmó pago manual'
        });

      // Send system message
      await supabase
        .from('mensajes')
        .insert({
          transaccion_id: transaccionId,
          emisor_id: user?.id,
          contenido: '✅ El pago ha sido verificado y confirmado. El dinero está retenido de forma segura. El vendedor puede proceder con el envío.',
          tipo_mensaje: 'sistema_admin'
        });

      toast.success('Pago confirmado exitosamente');
      fetchTransacciones();
      onUpdate();
    } catch (error: any) {
      toast.error('Error al confirmar pago: ' + error.message);
    } finally {
      setProcesando(null);
    }
  };

  const rechazarPago = async (transaccionId: string) => {
    setProcesando(transaccionId);
    try {
      // Update transaction status back to pending
      const { error: updateError } = await supabase
        .from('transacciones')
        .update({
          estado: 'pendiente_pago'
        })
        .eq('id', transaccionId);

      if (updateError) throw updateError;

      // Log admin action
      await supabase
        .from('registros_admin')
        .insert({
          admin_id: user?.id,
          transaccion_id: transaccionId,
          accion_realizada: 'Rechazó voucher de pago'
        });

      // Send system message to buyer
      await supabase
        .from('mensajes')
        .insert({
          transaccion_id: transaccionId,
          emisor_id: user?.id,
          contenido: '❌ El voucher de pago fue rechazado. Por favor, verifica que el comprobante sea correcto y vuelve a subirlo.',
          tipo_mensaje: 'sistema_admin'
        });

      // Send notification to seller about the delay
      await supabase
        .from('mensajes')
        .insert({
          transaccion_id: transaccionId,
          emisor_id: user?.id,
          contenido: '⚠️ El voucher de pago del comprador fue rechazado. El proceso de pago se ha reiniciado. Te notificaremos cuando el pago sea verificado correctamente.',
          tipo_mensaje: 'sistema_admin'
        });

      toast.success('Voucher rechazado. Se notificó al comprador y vendedor.');
      fetchTransacciones();
      onUpdate();
    } catch (error: any) {
      toast.error('Error al rechazar pago: ' + error.message);
    } finally {
      setProcesando(null);
    }
  };

  const abrirVoucher = async (url: string) => {
    try {
      const parsed = new URL(url);
      const marker = "/vouchers/";
      const idx = parsed.pathname.indexOf(marker);
      if (idx === -1) {
        window.open(url, "_blank");
        return;
      }
      const filePath = parsed.pathname.substring(idx + marker.length);
      const { data, error } = await supabase.storage
        .from("vouchers")
        .createSignedUrl(filePath, 60 * 60); // 1 hora

      if (error || !data?.signedUrl) {
        window.open(url, "_blank");
        return;
      }

      window.open(data.signedUrl, "_blank");
    } catch (e) {
      window.open(url, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (transacciones.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Todo al día</h3>
        <p className="text-muted-foreground">
          No hay pagos pendientes de verificación
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transacciones.map((transaccion) => (
        <Card key={transaccion.id} className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {transaccion.titulo_producto}
                </CardTitle>
                <CardDescription>
                  Código: {transaccion.codigo_invitacion}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  S/ {transaccion.precio_producto.toFixed(2)}
                </p>
                <Badge variant="default">Requiere verificación</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Fecha de pago: {new Date(transaccion.fecha_pago).toLocaleString('es-ES')}
            </div>

            {/* Vouchers */}
            {pruebas[transaccion.id] && pruebas[transaccion.id].length > 0 && (
              <div className="space-y-2">
                <p className="font-semibold text-sm">Vouchers subidos:</p>
                {pruebas[transaccion.id].map((prueba) => (
                  <div key={prueba.id} className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirVoucher(prueba.url_archivo)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver Voucher
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {new Date(prueba.fecha_carga).toLocaleString('es-ES')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => confirmarPago(transaccion.id)}
                disabled={procesando === transaccion.id}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar Pago
              </Button>
              <Button
                variant="destructive"
                onClick={() => rechazarPago(transaccion.id)}
                disabled={procesando === transaccion.id}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rechazar Voucher
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
