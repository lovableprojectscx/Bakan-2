import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  CheckCircle,
  AlertCircle,
  Truck,
  Clock,
  PartyPopper,
  ShieldCheck,
  Upload,
  CreditCard
} from 'lucide-react';
import { TransactionProgressSimple } from './TransactionProgressSimple';
import { ShippingProofForm } from './ShippingProofForm';
import { ShippingProofsGallery } from './ShippingProofsGallery';
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

interface TransactionWizardPanelProps {
  transaccion: Transaccion;
  esVendedor: boolean;
  esComprador: boolean;
  onTransactionUpdate: () => void;
}

export const TransactionWizardPanel = ({
  transaccion,
  esVendedor,
  esComprador,
  onTransactionUpdate
}: TransactionWizardPanelProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cuentasBakan, setCuentasBakan] = useState<CuentaBancaria[]>([]);
  const [mostrarCuentas, setMostrarCuentas] = useState(false);
  const [archivoVoucher, setArchivoVoucher] = useState<File | null>(null);
  const [subiendoVoucher, setSubiendoVoucher] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null);
  const [procesandoCancelacion, setProcesandoCancelacion] = useState(false);

  // Note: Verification time is NOT a hard limit - it's informational only
  // The admin verifies manually, so time shown is an estimate for user expectation
  useEffect(() => {
    // No countdown - just show that verification is in progress
    // This removes the misleading timer that suggested automatic action
    if (transaccion.estado === 'pago_en_verificacion') {
      setTiempoRestante(null);
    }
  }, [transaccion.estado]);

  interface CuentaBancaria {
    id: string;
    banco: string;
    numero_cuenta_o_celular: string;
    titular: string;
    instrucciones_adicionales: string | null;
    qr_image_url: string | null;
  }

  const fetchCuentasBakan = async () => {
    try {
      const { data, error } = await supabase
        .from('cuentas_bancarias_bakan')
        .select('*')
        .eq('esta_activa', true);

      if (error) throw error;
      setCuentasBakan(data || []);
      setMostrarCuentas(true);
    } catch (error: any) {
      toast.error('Error al cargar cuentas: ' + error.message);
    }
  };

  const handleArchivoVoucherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoVoucher(e.target.files[0]);
    }
  };

  const subirVoucher = async () => {
    if (!archivoVoucher) {
      toast.error('Debes seleccionar un voucher antes de enviar');
      return;
    }

    const file = archivoVoucher;

    if (file.size > 52428800) {
      toast.error('El archivo es muy grande. Máximo 50MB');
      return;
    }

    setSubiendoVoucher(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${transaccion.id}/voucher-${Date.now()}.${fileExt}`;

      console.log('Iniciando subida de voucher:', fileName); // Log start

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vouchers')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) {
        console.error('Storage Upload Error:', uploadError);
        throw new Error(`Error subiendo archivo (Storage): ${uploadError.message}`);
      }

      console.log('Subida exitosa, obteniendo URL publica...'); // Log success upload

      const { data: { publicUrl } } = supabase.storage
        .from('vouchers')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl); // Log URL

      console.log('Insertando en pruebas_transaccion...'); // Log DB insert start

      const { error: proofError } = await supabase
        .from('pruebas_transaccion')
        .insert({
          transaccion_id: transaccion.id,
          usuario_id: user?.id,
          tipo_prueba: 'voucher_pago',
          url_archivo: publicUrl,
          descripcion: 'Voucher de pago del comprador'
        });

      if (proofError) {
        console.error('DB Insert Error (pruebas_transaccion):', proofError);
        throw new Error(`Error guardando referencia (DB): ${proofError.message}`);
      }

      console.log('Insertando en transacciones...'); // Log DB update start

      const { error: updateError } = await supabase
        .from('transacciones')
        .update({
          estado: 'pago_en_verificacion',
          fecha_pago: new Date().toISOString()
        } as any)
        .eq('id', transaccion.id);

      if (updateError) {
        console.error('DB Update Error (transacciones):', updateError);
        throw new Error(`Error actualizando estado (DB): ${updateError.message}`);
      }

      // Enviar notificación al admin por email
      try {
        await supabase.functions.invoke('notify-admin-payment', {
          body: {
            transaccionId: transaccion.id,
            monto: transaccion.precio_producto
          }
        });
      } catch (emailError) {
        console.log('Error enviando email (no crítico):', emailError);
      }

      toast.success('Voucher subido correctamente. Esperando verificación del administrador.');
      setArchivoVoucher(null);
      onTransactionUpdate();
    } catch (error: any) {
      console.error('FULL CATCH ERROR:', error);
      toast.error(error.message || 'Error desconocido al subir voucher');
    } finally {
      setSubiendoVoucher(false);
    }
  };

  const marcarComoEnviado = async () => {
    // Server-side role validation: only seller can mark as shipped
    if (!esVendedor) {
      toast.error('Solo el vendedor puede marcar como enviado');
      return;
    }

    try {
      const { error } = await supabase
        .from('transacciones')
        .update({
          estado: 'enviado',
          fecha_envio: new Date().toISOString()
        } as any)
        .eq('id', transaccion.id)
        .eq('vendedor_id', user?.id); // Additional server-side check

      if (error) throw error;

      await supabase.from('mensajes').insert([{
        transaccion_id: transaccion.id,
        emisor_id: user?.id,
        contenido: '✅ El vendedor ha marcado el producto como enviado/entregado.',
        tipo_mensaje: 'sistema_automatico'
      }]);

      toast.success('¡Producto marcado como enviado!');
      onTransactionUpdate();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const confirmarRecepcion = async () => {
    // Server-side role validation: only buyer can confirm reception
    if (!esComprador) {
      toast.error('Solo el comprador puede confirmar la recepción');
      return;
    }

    try {
      const { error } = await supabase
        .from('transacciones')
        .update({
          estado: 'completada',
          fecha_liberacion: new Date().toISOString()
        } as any)
        .eq('id', transaccion.id)
        .eq('comprador_id', user?.id); // Additional server-side check

      if (error) throw error;

      toast.success('🎉 ¡Transacción completada exitosamente!');
      onTransactionUpdate();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const eliminarTransaccion = async () => {
    try {
      const { error } = await supabase
        .from('transacciones')
        .delete()
        .eq('id', transaccion.id);

      if (error) throw error;

      toast.success('Transacción eliminada correctamente');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  const solicitarCancelacion = async () => {
    setProcesandoCancelacion(true);
    try {
      const { error } = await supabase
        .from('transacciones')
        .update({ solicitud_cancelacion_por: user?.id } as any)
        .eq('id', transaccion.id);

      if (error) throw error;
      toast.success('Solicitud de cancelación enviada');
      onTransactionUpdate();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setProcesandoCancelacion(false);
    }
  };

  const responderCancelacion = async (aceptar: boolean) => {
    setProcesandoCancelacion(true);
    try {
      if (aceptar) {
        const { error } = await supabase
          .from('transacciones')
          .update({
            estado: 'cancelada',
            solicitud_cancelacion_por: null
          } as any)
          .eq('id', transaccion.id);
        if (error) throw error;
        toast.success('Transacción cancelada');
      } else {
        const { error } = await supabase
          .from('transacciones')
          .update({ solicitud_cancelacion_por: null } as any)
          .eq('id', transaccion.id);
        if (error) throw error;
        toast.success('Cancelación rechazada');
      }
      onTransactionUpdate();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setProcesandoCancelacion(false);
    }
  };

  const cancelarSolicitudPropia = async () => {
    setProcesandoCancelacion(true);
    try {
      const { error } = await supabase
        .from('transacciones')
        .update({ solicitud_cancelacion_por: null } as any)
        .eq('id', transaccion.id);

      if (error) throw error;
      toast.success('Solicitud de cancelación retirada');
      onTransactionUpdate();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setProcesandoCancelacion(false);
    }
  };

  const renderWizardStep = () => {
    switch (transaccion.estado) {
      case 'iniciada':
        return (
          <div className="space-y-3">
            <div className="text-center py-2">
              <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(59,130,246,0.1)] ring-4 ring-primary/5">
                <Clock className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <h3 className="text-lg font-bold mb-1">
                {esVendedor ? 'Esperando al comprador' : 'Esperando al vendedor'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                Comparte el código de invitación para que la otra persona se una a esta transacción.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/50 rounded-xl p-3">
              <div className="flex gap-2.5 text-center sm:text-left flex-col sm:flex-row items-center sm:items-start text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="text-[13px] leading-tight">
                  <p className="font-bold mb-0.5">Consejo de seguridad</p>
                  <p>No compartas datos personales hasta que ambas partes estén conectadas.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pendiente_pago':
        if (esComprador) {
          return (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(59,130,246,0.1)] ring-4 ring-primary/5">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-1">Realiza el pago</h3>
                <p className="text-muted-foreground">
                  Transfiere a una de nuestras cuentas y sube el comprobante
                </p>
              </div>

              {!mostrarCuentas ? (
                <Button onClick={fetchCuentasBakan} className="w-full" size="lg">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Ver Cuentas para Pagar
                </Button>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Cuentas de Bakan:</h4>
                  {cuentasBakan.map(cuenta => (
                    <Card key={cuenta.id} className="border-2">
                      <CardContent className="pt-4">
                        <div className="space-y-2 text-sm">
                          <p><span className="font-semibold">Banco:</span> {cuenta.banco}</p>
                          <p><span className="font-semibold">Cuenta:</span> {cuenta.numero_cuenta_o_celular}</p>
                          <p><span className="font-semibold">Titular:</span> {cuenta.titular}</p>
                          {cuenta.instrucciones_adicionales && (
                            <p className="text-muted-foreground">{cuenta.instrucciones_adicionales}</p>
                          )}
                          {cuenta.qr_image_url && (
                            <div className="pt-2 flex flex-col items-center gap-2">
                              <img
                                src={cuenta.qr_image_url}
                                alt={`QR ${cuenta.banco}`}
                                className="w-48 h-48 object-contain border rounded-lg"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(cuenta.qr_image_url!, '_blank')}
                                className="w-full"
                              >
                                📱 Ver QR en pantalla completa
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <div className="pt-4 space-y-3 border-t">
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-700 dark:text-amber-400">
                          <p className="font-semibold mb-1">Monto a pagar:</p>
                          <p className="text-xl font-bold">S/ {(transaccion.precio_producto + transaccion.comision_bakan).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/10 border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-3">
                      <div className="flex gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-[13px] leading-tight text-blue-700 dark:text-blue-400">
                          <p className="font-bold mb-0.5">💡 Consejo para futuras disputas:</p>
                          <p>Guarda siempre una captura de pantalla de tu transferencia bancaria. Te servirá de respaldo.</p>
                        </div>
                      </div>
                    </div>

                    <Label htmlFor="voucher-upload" className="text-sm font-semibold">
                      Subir Voucher de Pago <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="voucher-upload"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleArchivoVoucherChange}
                      disabled={subiendoVoucher}
                    />
                    {archivoVoucher && (
                      <p className="text-sm text-success">✓ Archivo seleccionado: {archivoVoucher.name}</p>
                    )}
                    <Button
                      onClick={subirVoucher}
                      disabled={!archivoVoucher || subiendoVoucher}
                      className="w-full h-12"
                      size="lg"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      {subiendoVoucher ? 'Enviando...' : 'Enviar Voucher'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        } else {
          return (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(245,158,11,0.1)] ring-4 ring-amber-500/10">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold mb-1">Esperando el pago</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  El comprador está realizando el pago. Te notificaremos cuando esté confirmado.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/10 border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-3">
                <div className="flex gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-[13px] leading-tight text-blue-700 dark:text-blue-400">
                    <p className="font-bold mb-0.5">Mientras esperas</p>
                    <ul className="space-y-0.5">
                      <li>• Prepara el producto para envío</li>
                      <li>• No envíes nada hasta confirmar el pago</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        }

      case 'pago_en_verificacion':
        const formatearTiempo = (segundos: number) => {
          const mins = Math.floor(segundos / 60);
          const secs = segundos % 60;
          return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <div className="w-12 h-12 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-2 relative shadow-[0_0_15px_rgba(245,158,11,0.1)] ring-4 ring-amber-500/10">
                <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
              </div>
              <h3 className="text-lg font-bold mb-1">Esperando confirmación</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Tu voucher ha sido enviado y está siendo verificado por nuestro equipo.
              </p>
            </div>

            {/* Verification Status Info */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-700 rounded-xl p-5">
              <div className="text-center">
                <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">Estado de verificación</p>
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                  <span className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                    En proceso de revisión
                  </span>
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  Nuestro equipo revisa los vouchers manualmente. Te notificaremos cuando esté listo.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-400">
                  <p className="font-semibold mb-1">¿Qué pasa ahora?</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Nuestro equipo verificará tu voucher</li>
                    <li>Recibirás una notificación cuando sea aprobado</li>
                    <li>El dinero quedará retenido de forma segura</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pagada_retenida':
        if (esVendedor) {
          return (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(34,197,94,0.1)] ring-4 ring-success/5">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-lg font-bold mb-1">¡Pago confirmado!</h3>
                <p className="text-muted-foreground text-sm">
                  Ahora envía el producto y sube las pruebas de envío.
                </p>
              </div>

              <div className="bg-success/5 border border-success/20 rounded-xl p-2 px-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Monto retenido:</span>
                  <span className="text-base font-bold text-success">S/ {transaccion.precio_producto.toFixed(2)}</span>
                </div>
              </div>

              {/* Shipping Proof Section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  Registrar Envío y Pruebas
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Completa los datos del envío y sube las pruebas necesarias (fotos, videos, comprobantes).
                </p>

                <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/50 rounded-xl p-3 mb-3">
                  <div className="flex gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-[13px] leading-tight text-amber-700 dark:text-amber-400">
                      <p className="font-bold mb-0.5">💡 Consejo Vital:</p>
                      <p>Graba un video empaquetando el producto. Es tu mejor prueba contra reclamos.</p>
                    </div>
                  </div>
                </div>
                <ShippingProofForm
                  transaccionId={transaccion.id}
                  userId={user?.id || ''}
                  onSuccess={onTransactionUpdate}
                />
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(34,197,94,0.1)] ring-4 ring-success/5">
                  <ShieldCheck className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-lg font-bold mb-1">Tu pago está seguro</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Bakan retiene el dinero hasta que confirmes que recibiste el producto correctamente.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm text-blue-700 dark:text-blue-400 text-center">
                  ⏳ Esperando que el vendedor envíe el producto...
                </p>
              </div>
            </div>
          );
        }

      case 'enviado':
        if (esComprador) {
          return (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(59,130,246,0.1)] ring-4 ring-primary/5">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-1">
                  ¡Producto en camino!
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Confirma cuando hayas recibido y verificado que todo está correcto.
                </p>
              </div>

              {/* Shipping Proofs Gallery for Buyer */}
              <ShippingProofsGallery
                transaccionId={transaccion.id}
                titulo="Pruebas del Vendedor"
              />

              <div className="bg-red-50 dark:bg-red-950/10 border border-red-200/50 dark:border-red-800/50 rounded-xl p-3">
                <div className="flex gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-[13px] leading-tight text-red-700 dark:text-red-400">
                    <p className="font-bold mb-1">💡 Consejo Vital (Unboxing):</p>
                    <p className="mb-1.5"><strong>Graba un video abriendo el paquete.</strong> Es tu prueba principal si algo sale mal.</p>
                    <div className="h-px bg-red-200 dark:bg-red-800 my-1.5" />
                    <p className="font-bold mb-0.5">Antes de confirmar:</p>
                    <ul className="space-y-0.5">
                      <li>• Verifica que el producto funciona</li>
                      <li>• Revisa que es lo que acordaste</li>
                    </ul>
                  </div>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full h-12 text-base bg-success hover:bg-success/90" size="lg">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Confirmar Recepción
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-center">
                      ¿Todo está correcto?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                      Al confirmar, el dinero se liberará al vendedor. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="sm:justify-center gap-2">
                    <AlertDialogCancel>Revisar de nuevo</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmarRecepcion} className="bg-success hover:bg-success/90">
                      Sí, todo está bien
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        } else {
          return (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-4 ring-primary/5">
                  <Clock className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <h3 className="text-xl font-bold mb-2">Esperando confirmación</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  El comprador debe confirmar que recibió el producto. Luego recibirás tu pago.
                </p>
              </div>

              {/* Show uploaded proofs to seller */}
              <ShippingProofsGallery
                transaccionId={transaccion.id}
                titulo="Tus Pruebas de Envío"
              />
            </div>
          );
        }

      case 'completada':
        const isPagado = transaccion.estado_pago_vendedor === 'pagado';

        return (
          <div className="space-y-4">
            <div className="text-center py-2">
              <div className="w-12 h-12 mx-auto bg-success/20 rounded-full flex items-center justify-center mb-2 animate-bounce shadow-[0_0_15px_rgba(34,197,94,0.1)] ring-4 ring-success/10">
                <PartyPopper className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-lg font-bold mb-1">🎉 ¡Transacción completada!</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {esVendedor
                  ? (isPagado
                    ? '¡El dinero ya fue transferido a tu cuenta!'
                    : 'El dinero será transferido a tu cuenta pronto.')
                  : '¡Gracias por tu compra! Esperamos que disfrutes tu producto.'}
              </p>
            </div>

            {esVendedor && (
              <>
                <div className={cn(
                  "border rounded-xl p-4",
                  isPagado
                    ? "bg-success/10 border-success/30"
                    : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                )}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Recibirás:</span>
                    <span className={cn(
                      "text-xl font-bold",
                      isPagado ? "text-success" : "text-amber-600"
                    )}>
                      S/ {transaccion.monto_a_liberar.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-current/10">
                    <span className="text-sm text-muted-foreground">Estado del pago:</span>
                    <span className={cn(
                      "text-sm font-semibold px-3 py-1 rounded-full",
                      isPagado
                        ? "bg-success/20 text-success"
                        : "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                    )}>
                      {isPagado ? '✓ Pagado' : '⏳ Pendiente de pago'}
                    </span>
                  </div>
                </div>

                {/* Voucher de pago de Bakan al vendedor */}
                {isPagado && transaccion.voucher_pago_vendedor_url && (
                  <div className="bg-gradient-to-br from-success/10 to-emerald-50 dark:from-success/20 dark:to-emerald-950/30 border-2 border-success/30 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-success/20 rounded-full">
                        <CheckCircle className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-success">¡Pago Recibido!</h4>
                        <p className="text-xs text-muted-foreground">Bakan ha transferido tu dinero</p>
                      </div>
                    </div>

                    <div className="bg-background/80 rounded-lg p-3 space-y-3">
                      {transaccion.voucher_pago_vendedor_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <div className="relative">
                          <img
                            src={transaccion.voucher_pago_vendedor_url}
                            alt="Comprobante de pago"
                            className="w-full rounded-lg border max-h-48 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(transaccion.voucher_pago_vendedor_url!, '_blank')}
                          />
                        </div>
                      ) : null}

                      <Button
                        variant="outline"
                        className="w-full border-success text-success hover:bg-success/10"
                        onClick={() => window.open(transaccion.voucher_pago_vendedor_url!, '_blank')}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Ver Comprobante Completo
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'en_disputa':
        return (
          <div className="text-center py-6">
            <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-destructive">Transacción en disputa</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Nuestro equipo está mediando. Te contactaremos pronto.
            </p>
          </div>
        );

      case 'cancelada':
      case 'cancelada_automatico':
        return (
          <div className="text-center py-6">
            <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Transacción cancelada</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Esta transacción ha sido cancelada y no se puede continuar.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Progress header */}
      <div className="bg-muted/30 p-4 border-b">
        <TransactionProgressSimple
          estadoActual={transaccion.estado}
        />
      </div>

      <CardContent className="p-4 sm:p-6">
        {renderWizardStep()}

        {/* Price summary - Receipt Style */}
        <div className="mt-4 bg-muted/40 rounded-xl p-3 border border-dashed border-muted-foreground/30 relative">
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-background px-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest border rounded-full">
            Resumen
          </div>
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Precio del producto:</span>
              <span className="font-medium font-mono">S/ {transaccion.precio_producto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Comisión de seguridad:</span>
              <span className="font-medium font-mono">S/ {transaccion.comision_bakan.toFixed(2)}</span>
            </div>
            <div className="h-px bg-muted-foreground/20 my-2" />

            {esComprador && (
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-muted-foreground">Total a Pagar:</span>
                <span className="text-xl font-black text-primary tracking-tight">
                  S/ {(transaccion.precio_producto + transaccion.comision_bakan).toFixed(2)}
                </span>
              </div>
            )}

            {esVendedor && (
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-muted-foreground">Recibirás:</span>
                <span className="text-xl font-black text-success tracking-tight">
                  S/ {transaccion.monto_a_liberar.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Management Actions - Only for active/pending transactions */}
        {['iniciada', 'pendiente_pago'].includes(transaccion.estado) && (
          <div className="mt-6 pt-4 border-t border-dashed border-muted-foreground/20">
            {(!transaccion.vendedor_id || !transaccion.comprador_id) ? (
              // Case 1: Single Participant (Abandoned)
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 h-9">
                    <AlertCircle className="w-4 h-4" />
                    Eliminar Transacción Inactiva
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta transacción no tiene un segundo participante. Se eliminará completamente de tu historial.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cerrar</AlertDialogCancel>
                    <AlertDialogAction onClick={eliminarTransaccion} className="bg-destructive hover:bg-destructive/90">
                      Eliminar permanentemente
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              // Case 2: Two Participants
              <div className="space-y-3">
                {!transaccion.solicitud_cancelacion_por ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2 h-9"
                    onClick={solicitarCancelacion}
                    disabled={procesandoCancelacion}
                  >
                    <AlertCircle className="w-4 h-4" />
                    Solicitar Cancelación Mutua
                  </Button>
                ) : transaccion.solicitud_cancelacion_por === user?.id ? (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-amber-600 font-medium animate-pulse">Esperando que el otro usuario acepte la cancelación...</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={cancelarSolicitudPropia}
                      disabled={procesandoCancelacion}
                    >
                      Retirar Solicitud
                    </Button>
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-3">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-bold text-center">
                      El otro usuario ha solicitado cancelar la transacción.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-8 text-xs bg-success hover:bg-success/90"
                        onClick={() => responderCancelacion(true)}
                        disabled={procesandoCancelacion}
                      >
                        Aceptar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs border"
                        onClick={() => responderCancelacion(false)}
                        disabled={procesandoCancelacion}
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
