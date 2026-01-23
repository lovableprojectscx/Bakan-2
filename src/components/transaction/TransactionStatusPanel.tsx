import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
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
  Clock, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Package, 
  DollarSign,
  FileText,
  Truck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Transaccion {
  id: string;
  estado: string;
  precio_producto: number;
  comision_bakan: number;
  monto_a_liberar: number;
  tipo_producto: string;
}

interface CuentaBancaria {
  id: string;
  banco: string;
  numero_cuenta_o_celular: string;
  titular: string;
  instrucciones_adicionales: string | null;
  qr_image_url: string | null;
}

interface TransactionStatusPanelProps {
  transaccion: Transaccion;
  esVendedor: boolean;
  esComprador: boolean;
  onTransactionUpdate: () => void;
}

export const TransactionStatusPanel = ({ 
  transaccion, 
  esVendedor, 
  esComprador,
  onTransactionUpdate 
}: TransactionStatusPanelProps) => {
  const { user } = useAuth();
  const [cuentasBakan, setCuentasBakan] = useState<CuentaBancaria[]>([]);
  const [subiendoVoucher, setSubiendoVoucher] = useState(false);
  const [mostrarCuentas, setMostrarCuentas] = useState(false);
  const [archivoVoucher, setArchivoVoucher] = useState<File | null>(null);

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

  const subirVoucher = async () => {
    if (!archivoVoucher) {
      toast.error('Debes seleccionar un voucher antes de enviar');
      return;
    }
    
    const file = archivoVoucher;

    if (file.size > 5242880) {
      toast.error('El archivo es muy grande. Máximo 5MB');
      return;
    }

    setSubiendoVoucher(true);
    try {
      // Upload voucher to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${transaccion.id}/voucher-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('vouchers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get URL
      const { data: { publicUrl } } = supabase.storage
        .from('vouchers')
        .getPublicUrl(fileName);

      // Create proof record
      const { error: proofError } = await supabase
        .from('pruebas_transaccion')
        .insert({
          transaccion_id: transaccion.id,
          usuario_id: user?.id,
          tipo_prueba: 'voucher_pago',
          url_archivo: publicUrl,
          descripcion: 'Voucher de pago del comprador'
        });

      if (proofError) throw proofError;

      // Update transaction status
      const { error: updateError } = await supabase
        .from('transacciones')
        .update({ 
          estado: 'pago_en_verificacion',
          fecha_pago: new Date().toISOString()
        })
        .eq('id', transaccion.id);

      if (updateError) throw updateError;

      toast.success('Voucher subido correctamente. Esperando verificación del administrador.');
      setArchivoVoucher(null);
      onTransactionUpdate();
    } catch (error: any) {
      toast.error('Error al subir voucher: ' + error.message);
    } finally {
      setSubiendoVoucher(false);
    }
  };

  const handleArchivoVoucherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setArchivoVoucher(null);
      return;
    }

    if (file.size > 5242880) {
      toast.error('El archivo es muy grande. Máximo 5MB');
      e.target.value = '';
      return;
    }

    setArchivoVoucher(file);
  };

  const marcarComoEnviado = async (voucherUrl?: string) => {
    try {
      const { error } = await supabase
        .from('transacciones')
        .update({ 
          estado: 'enviado',
          fecha_envio: new Date().toISOString()
        })
        .eq('id', transaccion.id);

      if (error) throw error;

      // Enviar mensaje del sistema notificando el envío
      await supabase.from('mensajes').insert([{
        transaccion_id: transaccion.id,
        emisor_id: user?.id,
        contenido: '✅ El vendedor ha marcado el producto como enviado.',
        tipo_mensaje: 'sistema_automatico'
      }]);

      toast.success('Transacción marcada como enviada');
      onTransactionUpdate();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const subirVoucherEnvio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5242880) {
      toast.error('El archivo es muy grande. Máximo 5MB');
      return;
    }

    setSubiendoVoucher(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${transaccion.id}/voucher-envio-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('vouchers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vouchers')
        .getPublicUrl(fileName);

      // Guardar prueba de envío
      const { error: proofError } = await supabase
        .from('pruebas_transaccion')
        .insert([{
          transaccion_id: transaccion.id,
          usuario_id: user?.id,
          tipo_prueba: 'prueba_envio',
          url_archivo: publicUrl,
          descripcion: 'Voucher de envío del vendedor'
        }]);

      if (proofError) throw proofError;

      // Marcar como enviado
      await marcarComoEnviado(publicUrl);
    } catch (error: any) {
      toast.error('Error al subir voucher: ' + error.message);
    } finally {
      setSubiendoVoucher(false);
    }
  };

  const confirmarRecepcion = async () => {
    try {
      const { error } = await supabase
        .from('transacciones')
        .update({ 
          estado: 'completada',
          fecha_liberacion: new Date().toISOString()
        })
        .eq('id', transaccion.id);

      if (error) throw error;

      toast.success('¡Transacción completada! El dinero será liberado al vendedor.');
      onTransactionUpdate();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const renderStatusContent = () => {
    switch (transaccion.estado) {
      case 'iniciada':
        return (
          <div className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Esperando que el comprador se una a la transacción.
              </AlertDescription>
            </Alert>
            
            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700 dark:text-orange-400">
                <p className="font-semibold mb-2">⚠️ ADVERTENCIA:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>No compartas información sensible hasta que ambas partes estén confirmadas</li>
                  <li>Verifica la identidad de la otra persona antes de proceder</li>
                  <li>Usa siempre el chat de la plataforma para mantener registro</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            {esVendedor && (
              <div className="text-sm text-muted-foreground">
                <p>Comparte el código de invitación con el comprador para que pueda unirse.</p>
              </div>
            )}
          </div>
        );

      case 'pendiente_pago':
        return (
          <div className="space-y-4">
            {esComprador ? (
              <>
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-400 font-medium">
                    Debes realizar el pago a una de las cuentas de Bakan.
                  </AlertDescription>
                </Alert>
                
                <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-700 dark:text-orange-400">
                    <p className="font-semibold mb-2">⚠️ ANTES DE PAGAR:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Verifica que la cuenta bancaria sea de Bakan (no del vendedor)</li>
                      <li>Guarda el comprobante de pago en un lugar seguro</li>
                      <li>No realices pagos fuera de la plataforma</li>
                      <li>El dinero estará retenido de forma segura hasta que confirmes la recepción</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                {!mostrarCuentas ? (
                  <Button onClick={fetchCuentasBakan} className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
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
                              <div className="pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(cuenta.qr_image_url!, '_blank')}
                                  className="w-full"
                                >
                                  📱 Ver QR de Pago
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <div className="pt-4 space-y-3">
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
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {subiendoVoucher ? 'Enviando...' : 'Enviar Voucher'}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-700 dark:text-orange-400 font-medium">
                    Esperando que el comprador realice el pago.
                  </AlertDescription>
                </Alert>
                
                <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700 dark:text-blue-400">
                    <p className="font-semibold mb-2">📋 VENDEDOR - RECOMENDACIONES:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>No envíes el producto hasta confirmar que el pago está retenido</li>
                      <li>Prepara el producto mientras esperas la confirmación</li>
                      <li>Ten lista la información de envío si es producto físico</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>
        );

      case 'pago_en_verificacion':
        return (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                El pago está siendo verificado por el equipo de Bakan. Esto puede tomar unos minutos.
              </AlertDescription>
            </Alert>
            
            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700 dark:text-orange-400">
                <p className="font-semibold mb-2">⚠️ IMPORTANTE:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Comprador:</strong> No contactes al vendedor para entregas hasta que se confirme el pago</li>
                  <li><strong>Vendedor:</strong> No envíes el producto hasta que el estado cambie a "Pagada (Retenida)"</li>
                  <li>La verificación es automática y tomará solo unos minutos</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'pagada_retenida':
        return (
          <div className="space-y-4">
            {esVendedor ? (
              <>
                <Alert className="border-success">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription>
                    El pago ha sido confirmado y está retenido de forma segura. Ahora puedes enviar el producto.
                  </AlertDescription>
                </Alert>
                
                <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-700 dark:text-orange-400">
                    <p className="font-semibold mb-2">⚠️ VENDEDOR - ANTES DE ENVIAR:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Empaca el producto de forma segura</li>
                      <li>Usa un método de envío con rastreo si es posible</li>
                      <li>Guarda comprobantes de envío</li>
                      <li>Mantén comunicación con el comprador a través del chat</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <Label htmlFor="voucher-envio-upload">Subir Comprobante de Envío (Opcional)</Label>
                  <Input
                    id="voucher-envio-upload"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={subirVoucherEnvio}
                    disabled={subiendoVoucher}
                  />
                  {subiendoVoucher && (
                    <p className="text-sm text-muted-foreground">Subiendo y marcando como enviado...</p>
                  )}
                  <Button 
                    onClick={() => marcarComoEnviado()} 
                    className="w-full"
                    disabled={subiendoVoucher}
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Marcar como Enviado sin Comprobante
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Tu pago ha sido confirmado. Esperando que el vendedor envíe el producto.
                  </AlertDescription>
                </Alert>

                <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700 dark:text-blue-400">
                    <p className="font-semibold mb-2">📋 COMPRADOR - MIENTRAS ESPERAS:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Tu dinero está retenido de forma segura por Bakan</li>
                      <li>Solo se liberará cuando confirmes que recibiste el producto</li>
                      <li>Mantente atento a las actualizaciones de envío</li>
                      <li>Prepárate para recibir el paquete</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>
        );

      case 'enviado':
        return (
          <div className="space-y-4">
            {esComprador ? (
              <>
                <Alert className="border-primary">
                  <Package className="h-4 w-4" />
                  <AlertDescription>
                    El vendedor ha enviado el producto. Confirma cuando lo recibas y esté todo correcto.
                  </AlertDescription>
                </Alert>
                
                <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-400">
                    <p className="font-semibold mb-2">🛑 COMPRADOR - MUY IMPORTANTE:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>NO CONFIRMES LA RECEPCIÓN</strong> hasta verificar todo completamente</li>
                      <li>Revisa que el producto esté en perfecto estado</li>
                      <li>Verifica que coincida con la descripción acordada</li>
                      <li>Documenta cualquier problema antes de confirmar</li>
                      <li>Una vez confirmes, el dinero se liberará al vendedor y no podrás revertirlo</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar Recepción
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-600 dark:text-red-400">
                        ⚠️ ÚLTIMA ADVERTENCIA - LEE CON ATENCIÓN
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p className="font-semibold text-foreground">
                          ¿Estás completamente seguro de que TODO está correcto?
                        </p>
                        
                        <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                          <p className="text-red-700 dark:text-red-400 font-semibold mb-2">
                            🚨 UNA VEZ QUE CONFIRMES:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-600 dark:text-red-400">
                            <li>El dinero se liberará INMEDIATAMENTE al vendedor</li>
                            <li>NO PODRÁS recuperar el dinero ni cancelar</li>
                            <li>NO PODRÁS abrir disputas después</li>
                            <li>Esta acción es IRREVERSIBLE</li>
                          </ul>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
                          <p className="text-yellow-700 dark:text-yellow-400 font-semibold mb-2">
                            ✅ Verifica que:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
                            <li>El producto llegó en PERFECTO estado</li>
                            <li>Coincide 100% con lo acordado</li>
                            <li>No tiene daños, fallas o defectos</li>
                            <li>Revisaste TODO completamente</li>
                          </ul>
                        </div>

                        <p className="text-sm text-muted-foreground italic">
                          Si tienes CUALQUIER duda, cancela y contacta al vendedor primero por el chat.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        Cancelar - Revisar Nuevamente
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={confirmarRecepcion}
                        className="bg-success hover:bg-success/90"
                      >
                        Sí, Confirmar y Liberar Dinero
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Alert>
                  <Truck className="h-4 w-4" />
                  <AlertDescription>
                    Producto enviado. Esperando confirmación del comprador.
                  </AlertDescription>
                </Alert>
                
                <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700 dark:text-blue-400">
                    <p className="font-semibold mb-2">📋 VENDEDOR - RECOMENDACIONES:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Mantén comunicación con el comprador</li>
                      <li>Conserva todos los comprobantes de envío</li>
                      <li>Si hay algún problema, repórtalo inmediatamente</li>
                      <li>El dinero se liberará cuando el comprador confirme la recepción</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>
        );

      case 'completada':
        return (
          <div className="space-y-4">
            <Alert className="border-success bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription>
                ¡Transacción completada exitosamente! {esVendedor ? 'El dinero será transferido a tu cuenta.' : 'Gracias por tu compra.'}
              </AlertDescription>
            </Alert>
            
            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                <p className="font-semibold mb-2">✅ RECORDATORIOS FINALES:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {esVendedor ? (
                    <>
                      <li>El pago será procesado según los tiempos establecidos</li>
                      <li>Conserva todos los comprobantes de la transacción</li>
                      <li>Puedes calificar al comprador para ayudar a la comunidad</li>
                    </>
                  ) : (
                    <>
                      <li>Guarda toda la información del producto recibido</li>
                      <li>Conserva los comprobantes de pago y comunicaciones</li>
                      <li>Puedes calificar al vendedor para ayudar a otros compradores</li>
                    </>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'en_disputa':
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta transacción está en disputa. El equipo de Bakan está mediando el caso.
            </AlertDescription>
          </Alert>
        );

      case 'cancelada':
      case 'cancelada_automatico':
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta transacción ha sido cancelada.
            </AlertDescription>
          </Alert>
        );

      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    const estadoConfig: Record<string, { label: string; variant: any }> = {
      iniciada: { label: 'Iniciada', variant: 'secondary' },
      pendiente_pago: { label: 'Pendiente de Pago', variant: 'default' },
      pago_en_verificacion: { label: 'Verificando Pago', variant: 'default' },
      pagada_retenida: { label: 'Pagada (Retenida)', variant: 'default' },
      enviado: { label: 'Enviado', variant: 'default' },
      completada: { label: 'Completada', variant: 'default' },
      en_disputa: { label: 'En Disputa', variant: 'destructive' },
      cancelada: { label: 'Cancelada', variant: 'secondary' },
      cancelada_automatico: { label: 'Cancelada (Auto)', variant: 'secondary' }
    };

    const config = estadoConfig[transaccion.estado] || { label: transaccion.estado, variant: 'secondary' };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Estado</span>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Información de la transacción
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderStatusContent()}

        <div className="pt-4 border-t space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Precio del producto:</span>
            <span className="font-semibold">S/ {transaccion.precio_producto.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Comisión de seguridad:</span>
            <span className="font-semibold">S/ {transaccion.comision_bakan.toFixed(2)}</span>
          </div>
          {esComprador && (
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">Total pagado:</span>
              <span className="font-semibold text-primary">S/ {(transaccion.precio_producto + transaccion.comision_bakan).toFixed(2)}</span>
            </div>
          )}
          {esVendedor && (
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">Recibirás:</span>
              <span className="font-semibold text-success">S/ {transaccion.precio_producto.toFixed(2)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
