import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DollarSign, Upload, User, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TransaccionPendiente {
  id: string;
  codigo_invitacion: string;
  titulo_producto: string;
  monto_a_liberar: number;
  vendedor_id: string;
  fecha_liberacion: string;
  profiles: {
    nombre_completo: string;
    telefono: string | null;
  };
  perfiles_financieros: Array<{
    banco: string;
    numero_cuenta: string;
    tipo_cuenta: string;
  }>;
}

export const PagarVendedoresTab = ({ onUpdate }: { onUpdate: () => void }) => {
  const { user } = useAuth();
  const [transacciones, setTransacciones] = useState<TransaccionPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [subiendoVoucher, setSubiendoVoucher] = useState<string | null>(null);

  useEffect(() => {
    fetchTransacciones();
  }, []);

  const fetchTransacciones = async () => {
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .eq('estado', 'completada')
        .eq('estado_pago_vendedor', 'pendiente_de_pago')
        .order('fecha_liberacion', { ascending: true });

      if (error) throw error;

      // Fetch vendor profiles and financial profiles separately
      const transaccionesConDatos = await Promise.all((data || []).map(async (tx) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nombre_completo, telefono')
          .eq('id', tx.vendedor_id)
          .single();

        const { data: financieros } = await supabase
          .from('perfiles_financieros')
          .select('banco, numero_cuenta, tipo_cuenta')
          .eq('usuario_id', tx.vendedor_id)
          .eq('esta_activo', true);

        return {
          ...tx,
          profiles: profile || { nombre_completo: 'Usuario', telefono: null },
          perfiles_financieros: financieros || []
        };
      }));

      setTransacciones(transaccionesConDatos);
    } catch (error: any) {
      toast.error('Error al cargar transacciones: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const subirVoucherPago = async (transaccionId: string, file: File) => {
    setSubiendoVoucher(transaccionId);
    try {
      // Upload voucher to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `admin/${transaccionId}/pago-vendedor-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('vouchers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get URL
      const { data: { publicUrl } } = supabase.storage
        .from('vouchers')
        .getPublicUrl(fileName);

      // Update transaction
      const { error: updateError } = await supabase
        .from('transacciones')
        .update({
          estado_pago_vendedor: 'pagado',
          voucher_pago_vendedor_url: publicUrl
        })
        .eq('id', transaccionId);

      if (updateError) throw updateError;

      // Log admin action
      await supabase
        .from('registros_admin')
        .insert({
          admin_id: user?.id,
          transaccion_id: transaccionId,
          accion_realizada: 'Pagó al vendedor y subió voucher'
        });

      // Send system message
      await supabase
        .from('mensajes')
        .insert({
          transaccion_id: transaccionId,
          emisor_id: user?.id,
          contenido: '💰 El pago ha sido procesado y enviado al vendedor. ¡Transacción finalizada!',
          tipo_mensaje: 'sistema_admin'
        });

      toast.success('Pago registrado exitosamente');
      fetchTransacciones();
      onUpdate();
    } catch (error: any) {
      toast.error('Error al subir voucher: ' + error.message);
    } finally {
      setSubiendoVoucher(null);
    }
  };

  const marcarEnProceso = async (transaccionId: string) => {
    setProcesando(transaccionId);
    try {
      const { error } = await supabase
        .from('transacciones')
        .update({ estado_pago_vendedor: 'en_proceso' })
        .eq('id', transaccionId);

      if (error) throw error;

      // Log admin action
      await supabase
        .from('registros_admin')
        .insert({
          admin_id: user?.id,
          transaccion_id: transaccionId,
          accion_realizada: 'Marcó pago a vendedor como en proceso'
        });

      toast.success('Marcado como en proceso');
      fetchTransacciones();
      onUpdate();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setProcesando(null);
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
        <DollarSign className="w-16 h-16 text-success mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Todo al día</h3>
        <p className="text-muted-foreground">
          No hay vendedores pendientes de pago
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
                <p className="text-2xl font-bold text-success">
                  S/ {transaccion.monto_a_liberar.toFixed(2)}
                </p>
                <Badge variant="default">Pendiente de pago</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <p className="font-semibold">{transaccion.profiles.nombre_completo}</p>
              </div>
              {transaccion.profiles.telefono && (
                <p className="text-sm text-muted-foreground">
                  Tel: {transaccion.profiles.telefono}
                </p>
              )}
            </div>

            {transaccion.perfiles_financieros && transaccion.perfiles_financieros.length > 0 && (
              <div className="space-y-2">
                <p className="font-semibold text-sm">Datos bancarios del vendedor:</p>
                {transaccion.perfiles_financieros.map((perfil, idx) => (
                  <Card key={idx} className="bg-muted/50">
                    <CardContent className="pt-4 text-sm">
                      <p><span className="font-semibold">Banco:</span> {perfil.banco}</p>
                      <p><span className="font-semibold">Cuenta:</span> {perfil.numero_cuenta}</p>
                      <p><span className="font-semibold">Tipo:</span> {perfil.tipo_cuenta}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              Completada: {new Date(transaccion.fecha_liberacion).toLocaleString('es-ES')}
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div>
                <Label htmlFor={`voucher-${transaccion.id}`}>Subir Voucher de Pago</Label>
                <Input
                  id={`voucher-${transaccion.id}`}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) subirVoucherPago(transaccion.id, file);
                  }}
                  disabled={subiendoVoucher === transaccion.id}
                />
              </div>
              
              <Button
                variant="secondary"
                onClick={() => marcarEnProceso(transaccion.id)}
                disabled={procesando === transaccion.id || subiendoVoucher === transaccion.id}
                className="w-full"
              >
                Marcar como En Proceso
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
