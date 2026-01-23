import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface UseTransactionActionsProps {
  transaccion: Transaccion;
  userId: string | undefined;
  esVendedor: boolean;
  onTransactionUpdate: () => void;
}

export const useTransactionActions = ({
  transaccion,
  userId,
  esVendedor,
  onTransactionUpdate
}: UseTransactionActionsProps) => {
  const [cuentasBakan, setCuentasBakan] = useState<CuentaBancaria[]>([]);
  const [mostrarCuentas, setMostrarCuentas] = useState(false);
  const [archivoVoucher, setArchivoVoucher] = useState<File | null>(null);
  const [subiendoVoucher, setSubiendoVoucher] = useState(false);

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

  /**
   * Helper to generate signed URL for private vouchers bucket
   */
  const getSignedVoucherUrl = async (fileName: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('vouchers')
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

    if (error || !data?.signedUrl) {
      // Fallback to stored path for later signed URL generation
      return fileName;
    }

    return data.signedUrl;
  };

  /**
   * Upload payment voucher and update transaction to 'pago_en_verificacion'
   */
  const subirVoucher = async () => {
    if (!archivoVoucher) {
      toast.error('Debes seleccionar un voucher antes de enviar');
      return;
    }

    if (!userId) {
      toast.error('Usuario no autenticado');
      return;
    }

    if (archivoVoucher.size > 5242880) {
      toast.error('El archivo es muy grande. Máximo 5MB');
      return;
    }

    setSubiendoVoucher(true);
    try {
      const fileExt = archivoVoucher.name.split('.').pop();
      const fileName = `${userId}/${transaccion.id}/voucher-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('vouchers')
        .upload(fileName, archivoVoucher);

      if (uploadError) throw uploadError;

      // Store file path for later signed URL generation (private bucket)
      const { error: proofError } = await supabase
        .from('pruebas_transaccion')
        .insert({
          transaccion_id: transaccion.id,
          usuario_id: userId,
          tipo_prueba: 'voucher_pago',
          url_archivo: fileName, // Store path, not public URL
          descripcion: 'Voucher de pago del comprador'
        });

      if (proofError) throw proofError;

      const { error: updateError } = await supabase
        .from('transacciones')
        .update({
          estado: 'pago_en_verificacion',
          fecha_pago: new Date().toISOString()
        })
        .eq('id', transaccion.id);

      if (updateError) throw updateError;

      // Notify admin by email (non-critical)
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
      toast.error('Error al subir voucher: ' + error.message);
    } finally {
      setSubiendoVoucher(false);
    }
  };

  /**
   * Mark transaction as shipped (only seller can do this)
   */
  const marcarComoEnviado = async () => {
    if (!esVendedor) {
      toast.error('Solo el vendedor puede marcar como enviado');
      return;
    }

    if (!userId) {
      toast.error('Usuario no autenticado');
      return;
    }

    try {
      const { error } = await supabase
        .from('transacciones')
        .update({
          estado: 'enviado',
          fecha_envio: new Date().toISOString()
        })
        .eq('id', transaccion.id);

      if (error) throw error;

      await supabase.from('mensajes').insert([{
        transaccion_id: transaccion.id,
        emisor_id: userId,
        contenido: '✅ El vendedor ha marcado el producto como enviado/entregado.',
        tipo_mensaje: 'sistema_automatico'
      }]);

      toast.success('¡Producto marcado como enviado!');
      onTransactionUpdate();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  /**
   * Upload shipping voucher and mark as shipped
   */
  const subirVoucherEnvio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!esVendedor) {
      toast.error('Solo el vendedor puede subir pruebas de envío');
      return;
    }

    if (!userId) {
      toast.error('Usuario no autenticado');
      return;
    }

    if (file.size > 5242880) {
      toast.error('El archivo es muy grande. Máximo 5MB');
      return;
    }

    setSubiendoVoucher(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${transaccion.id}/voucher-envio-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('vouchers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Store file path for later signed URL generation (private bucket)
      const { error: proofError } = await supabase
        .from('pruebas_transaccion')
        .insert([{
          transaccion_id: transaccion.id,
          usuario_id: userId,
          tipo_prueba: 'prueba_envio',
          url_archivo: fileName,
          descripcion: 'Voucher de envío del vendedor'
        }]);

      if (proofError) throw proofError;

      await marcarComoEnviado();
    } catch (error: any) {
      toast.error('Error al subir voucher: ' + error.message);
    } finally {
      setSubiendoVoucher(false);
    }
  };

  /**
   * Confirm reception and complete transaction (only buyer can do this)
   */
  const confirmarRecepcion = async () => {
    if (esVendedor) {
      toast.error('Solo el comprador puede confirmar la recepción');
      return;
    }

    if (!userId) {
      toast.error('Usuario no autenticado');
      return;
    }

    try {
      const { error } = await supabase
        .from('transacciones')
        .update({
          estado: 'completada',
          fecha_liberacion: new Date().toISOString()
        })
        .eq('id', transaccion.id);

      if (error) throw error;

      await supabase.from('mensajes').insert([{
        transaccion_id: transaccion.id,
        emisor_id: userId,
        contenido: '🎉 ¡El comprador ha confirmado la recepción! Transacción completada exitosamente.',
        tipo_mensaje: 'sistema_automatico'
      }]);

      toast.success('🎉 ¡Transacción completada exitosamente!');
      onTransactionUpdate();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  return {
    cuentasBakan,
    mostrarCuentas,
    archivoVoucher,
    subiendoVoucher,
    fetchCuentasBakan,
    handleArchivoVoucherChange,
    subirVoucher,
    marcarComoEnviado,
    subirVoucherEnvio,
    confirmarRecepcion,
    getSignedVoucherUrl,
    setArchivoVoucher
  };
};
