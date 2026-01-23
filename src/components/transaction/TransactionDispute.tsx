import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

interface TransactionDisputeProps {
  transaccionId: string;
  userId: string;
  estadoActual: string;
  onDisputeCreated: () => void;
}

export const TransactionDispute = ({ 
  transaccionId, 
  userId, 
  estadoActual,
  onDisputeCreated 
}: TransactionDisputeProps) => {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [cuentaBanco, setCuentaBanco] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [creando, setCreando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!motivo.trim()) {
      toast.error('Debes proporcionar un motivo para la disputa');
      return;
    }

    setCreando(true);
    try {
      // Crear la disputa
      const { error: disputaError } = await supabase
        .from('disputas')
        .insert({
          transaccion_id: transaccionId,
          reportante_id: userId,
          motivo: motivo.trim(),
          estado_disputa: 'abierta',
          reembolso_banco_comprador: cuentaBanco.trim() || null,
          reembolso_cuenta_comprador: numeroCuenta.trim() || null
        });

      if (disputaError) throw disputaError;

      // Actualizar estado de la transacción
      const { error: transaccionError } = await supabase
        .from('transacciones')
        .update({ estado: 'en_disputa' })
        .eq('id', transaccionId);

      if (transaccionError) throw transaccionError;

      // Enviar mensaje del sistema
      await supabase.from('mensajes').insert([{
        transaccion_id: transaccionId,
        emisor_id: userId,
        contenido: '🚨 Se ha abierto una disputa para esta transacción. Un administrador revisará el caso.',
        tipo_mensaje: 'sistema_admin'
      }]);

      toast.success('Disputa creada correctamente. Un administrador revisará el caso.');
      setOpen(false);
      setMotivo('');
      setCuentaBanco('');
      setNumeroCuenta('');
      onDisputeCreated();
    } catch (error: any) {
      toast.error('Error al crear disputa: ' + error.message);
    } finally {
      setCreando(false);
    }
  };

  // Solo permitir disputas en estados donde tiene sentido (después de que el pago esté confirmado)
  // No se puede disputar en: iniciada, pendiente_pago, pago_en_verificacion, en_disputa, cancelada, completada
  const estadosQuePermitenDisputa = ['pagada_retenida', 'enviado'];
  const puedeDisputar = estadosQuePermitenDisputa.includes(estadoActual);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="destructive" 
          className="w-full"
          disabled={!puedeDisputar}
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Reportar Problema / Crear Disputa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear Disputa</DialogTitle>
            <DialogDescription>
              Describe el problema con esta transacción. Un administrador revisará tu caso.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo de la Disputa *</Label>
              <Textarea
                id="motivo"
                placeholder="Describe detalladamente el problema (producto no recibido, diferente a lo acordado, etc.)"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={5}
                required
                disabled={creando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banco">Banco para Reembolso (Opcional)</Label>
              <Input
                id="banco"
                placeholder="Ej: BCP, Interbank, BBVA..."
                value={cuentaBanco}
                onChange={(e) => setCuentaBanco(e.target.value)}
                disabled={creando}
              />
              <p className="text-xs text-muted-foreground">
                Solo si eres el comprador y deseas reembolso
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuenta">Número de Cuenta para Reembolso (Opcional)</Label>
              <Input
                id="cuenta"
                placeholder="Número de cuenta bancaria"
                value={numeroCuenta}
                onChange={(e) => setNumeroCuenta(e.target.value)}
                disabled={creando}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={creando}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              variant="destructive"
              disabled={creando}
            >
              {creando ? 'Creando...' : 'Crear Disputa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
