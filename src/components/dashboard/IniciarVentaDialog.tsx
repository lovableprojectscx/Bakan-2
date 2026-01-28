import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

export const IniciarVentaDialog = ({
  onTransactionCreated,
  children,
  fixedRole
}: {
  onTransactionCreated?: () => void,
  children?: React.ReactNode,
  fixedRole?: 'vendedor' | 'comprador'
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [miRol, setMiRol] = useState(fixedRole || '');
  const [creando, setCreando] = useState(false);

  // Generate an 8-character code (reduced collision probability from ~1.6M to ~2.8B combinations)
  const generarCodigo = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = 'BK-';
    for (let i = 0; i < 8; i++) {
      codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return codigo;
  };

  const crearTransaccion = async () => {
    if (!titulo || !precio || !miRol) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    const precioNum = parseFloat(precio);

    // Validate minimum amount
    if (precioNum < 10) {
      toast.error('El monto mínimo de transacción es S/ 10.00');
      return;
    }

    setCreando(true);
    try {
      const comision = precioNum < 100 ? 3.00 : (precioNum * 0.03); // 3% o mínimo S/ 3.00 si es < 100

      // Generate unique code with retry logic
      let codigo = generarCodigo();
      let intentos = 0;
      const maxIntentos = 5;

      while (intentos < maxIntentos) {
        const { data: existente } = await supabase
          .from('transacciones')
          .select('id')
          .eq('codigo_invitacion', codigo)
          .maybeSingle();

        if (!existente) break;

        codigo = generarCodigo();
        intentos++;
      }

      if (intentos >= maxIntentos) {
        throw new Error('No se pudo generar un código único. Intenta de nuevo.');
      }

      const transaccionData: any = {
        titulo_producto: titulo,
        descripcion: descripcion || null,
        precio_producto: precioNum,
        comision_bakan: comision,
        monto_a_liberar: precioNum, // El vendedor recibe el precio completo
        tipo_producto: 'fisico' as const,
        codigo_invitacion: codigo,
        estado: 'iniciada' as const
      };

      // Asignar el rol correcto según la selección
      if (miRol === 'vendedor') {
        transaccionData.vendedor_id = user?.id;
      } else {
        transaccionData.comprador_id = user?.id;
      }

      const { data, error } = await supabase
        .from('transacciones')
        .insert([transaccionData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Transacción creada exitosamente');
      setOpen(false);
      setTitulo('');
      setDescripcion('');
      setPrecio('');
      setMiRol('');

      if (onTransactionCreated) onTransactionCreated();
      navigate(`/transaction/${data.id}`);
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setCreando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="w-full shadow-soft" size="lg">
            Crear Nueva Venta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Iniciar Transacción Protegida</DialogTitle>
          <DialogDescription>
            Crea un link seguro para tu transacción
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!fixedRole && (
            <div>
              <Label>Mi Rol en esta Transacción *</Label>
              <Select value={miRol} onValueChange={setMiRol}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu rol..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendedor">Soy el Vendedor</SelectItem>
                  <SelectItem value="comprador">Soy el Comprador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Título del Producto *</Label>
            <Input placeholder="Ej: iPhone 14 Pro Max 256GB" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <Label>Descripción (opcional)</Label>
            <Textarea placeholder="Detalles del producto..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
          </div>
          <div>
            <Label>Precio (S/) *</Label>
            <Input type="number" placeholder="1500.00" value={precio} onChange={(e) => setPrecio(e.target.value)} />
          </div>
          {precio && miRol && (
            <div className="bg-muted p-3 rounded text-sm space-y-1">
              <p><strong>Precio del producto:</strong> S/ {parseFloat(precio || '0').toFixed(2)}</p>
              <p><strong>Comisión Bakan (seguridad):</strong> S/ {(parseFloat(precio || '0') < 100 ? 3.00 : parseFloat(precio || '0') * 0.03).toFixed(2)}</p>
              {miRol === 'vendedor' && (
                <p className="text-success font-semibold"><strong>Recibirás:</strong> S/ {parseFloat(precio || '0').toFixed(2)}</p>
              )}
              {miRol === 'comprador' && (
                <p className="text-primary font-semibold"><strong>Total a pagar:</strong> S/ {(parseFloat(precio || '0') + (parseFloat(precio || '0') < 100 ? 3.00 : parseFloat(precio || '0') * 0.03)).toFixed(2)}</p>
              )}
            </div>
          )}
          <Button onClick={crearTransaccion} disabled={creando} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            {creando ? 'Creando...' : 'Crear Transacción'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
