import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

export const UnirseCompraDialog = ({ onJoined, children }: { onJoined?: () => void, children?: React.ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [uniendose, setUniendose] = useState(false);

  const unirseACompra = async () => {
    if (!codigo.trim()) {
      toast.error('Ingresa el código de invitación');
      return;
    }

    setUniendose(true);
    try {
      const { data: transactionId, error } = await supabase.rpc('join_transaction_by_code', {
        _code: codigo.trim()
      });

      if (error) {
        if (error.message.includes('NOT_AUTHENTICATED')) {
          toast.error('Debes estar autenticado');
        } else if (error.message.includes('INVALID_CODE')) {
          toast.error('Código inválido');
        } else if (error.message.includes('ALREADY_COMPLETE')) {
          toast.error('Esta transacción ya tiene ambas partes asignadas');
        } else if (error.message.includes('OWN_TRANSACTION')) {
          toast.error('No puedes unirte a tu propia transacción');
        } else {
          toast.error('Error: ' + error.message);
        }
        setUniendose(false);
        return;
      }

      toast.success('¡Te uniste a la transacción!');
      setOpen(false);
      setCodigo('');

      if (onJoined) onJoined();
      navigate(`/transaction/${transactionId}`);
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setUniendose(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="secondary" className="w-full shadow-soft" size="lg">
            Ingresar Código
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Unirse a una Transacción</DialogTitle>
          <DialogDescription>
            Ingresa el código que te compartió la otra parte
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Código de Invitación</Label>
            <Input
              placeholder="BK-XXXX"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              className="font-mono text-lg"
            />
          </div>
          <Button onClick={unirseACompra} disabled={uniendose} className="w-full">
            <ShoppingCart className="w-4 h-4 mr-2" />
            {uniendose ? 'Verificando...' : 'Unirse a la Transacción'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
