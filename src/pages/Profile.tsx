import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Plus, Trash2, Upload, CheckCircle, Clock } from 'lucide-react';

interface PerfilFinanciero {
  id: string;
  banco: string;
  numero_cuenta: string;
  tipo_cuenta: string;
  esta_activo: boolean;
}

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [perfiles, setPerfiles] = useState<PerfilFinanciero[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [subiendoDNI, setSubiendoDNI] = useState(false);

  // Form states
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [banco, setBanco] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchProfile();
      fetchPerfiles();
    }
  }, [user, loading, navigate]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();

    if (data) {
      setProfile(data);
      setNombreCompleto(data.nombre_completo);
      setTelefono(data.telefono || '');
    }
  };

  const fetchPerfiles = async () => {
    const { data } = await supabase
      .from('perfiles_financieros')
      .select('*')
      .eq('usuario_id', user?.id);

    setPerfiles(data || []);
  };

  const actualizarPerfil = async () => {
    setGuardando(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nombre_completo: nombreCompleto, telefono })
        .eq('id', user?.id);

      if (error) throw error;
      toast.success('Perfil actualizado');
      fetchProfile();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const agregarCuenta = async () => {
    try {
      const { error } = await supabase
        .from('perfiles_financieros')
        .insert([{
          usuario_id: user?.id,
          banco,
          numero_cuenta: numeroCuenta,
          tipo_cuenta: tipoCuenta as any,
          esta_activo: perfiles.length === 0
        }] as any);

      if (error) throw error;
      toast.success('Cuenta agregada');
      setBanco('');
      setNumeroCuenta('');
      setTipoCuenta('');
      fetchPerfiles();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const eliminarCuenta = async (id: string) => {
    try {
      const { error } = await supabase
        .from('perfiles_financieros')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Cuenta eliminada');
      fetchPerfiles();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const subirDNI = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoDNI(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/dni-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos-identidad')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documentos-identidad')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          documento_identidad_url: publicUrl,
          estado_verificacion: 'pendiente_revision'
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      toast.success('Documento subido. Esperando verificación.');
      fetchProfile();
    } catch (error: any) {
      toast.error('Error al subir documento: ' + error.message);
    } finally {
      setSubiendoDNI(false);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-12 max-w-4xl">
        <h1 className="text-2xl sm:text-4xl font-bold mb-6 sm:mb-8 flex items-center gap-3">
          <User className="w-6 h-6 sm:w-8 sm:h-8" />
          Mi Perfil
        </h1>

        {/* Datos Personales */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Datos Personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre Completo</Label>
              <Input value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <Button onClick={actualizarPerfil} disabled={guardando}>Guardar Cambios</Button>
          </CardContent>
        </Card>

        {/* Verificación */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Verificación de Identidad</CardTitle>
              <Badge variant={profile?.estado_verificacion === 'verificado' ? 'default' : 'secondary'}>
                {profile?.estado_verificacion === 'verificado' ? <CheckCircle className="w-4 h-4 mr-1" /> : <Clock className="w-4 h-4 mr-1" />}
                {profile?.estado_verificacion === 'verificado' ? 'Verificado' : profile?.estado_verificacion === 'pendiente_revision' ? 'Pendiente' : 'No verificado'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Label>Subir Documento de Identidad (DNI)</Label>
            <Input type="file" accept="image/*" onChange={subirDNI} disabled={subiendoDNI} />
          </CardContent>
        </Card>

        {/* Cuentas Bancarias */}
        <Card>
          <CardHeader>
            <CardTitle>Cuentas Bancarias</CardTitle>
            <CardDescription>Para recibir pagos como vendedor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {perfiles.map((p) => (
              <div key={p.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 border rounded">
                <div className="flex-1">
                  <p className="font-semibold text-sm sm:text-base">{p.banco}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground break-all">{p.numero_cuenta} - {p.tipo_cuenta}</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => eliminarCuenta(p.id)} className="w-full sm:w-auto">
                  <Trash2 className="w-4 h-4 mr-2 sm:mr-0" />
                  <span className="sm:hidden">Eliminar</span>
                </Button>
              </div>
            ))}

            <div className="space-y-3 pt-4 border-t">
              <Select value={banco} onValueChange={setBanco}>
                <SelectTrigger><SelectValue placeholder="Banco" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yape">Yape</SelectItem>
                  <SelectItem value="Plin">Plin</SelectItem>
                  <SelectItem value="BCP">BCP</SelectItem>
                  <SelectItem value="Interbank">Interbank</SelectItem>
                  <SelectItem value="BBVA">BBVA</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Número de cuenta o celular" value={numeroCuenta} onChange={(e) => setNumeroCuenta(e.target.value)} />
              <Select value={tipoCuenta} onValueChange={setTipoCuenta}>
                <SelectTrigger><SelectValue placeholder="Tipo de cuenta" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="celular">Celular (Yape/Plin)</SelectItem>
                  <SelectItem value="ahorros">Ahorros</SelectItem>
                  <SelectItem value="corriente">Corriente</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={agregarCuenta} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Cuenta
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Extra space for mobile dropdowns */}
        <div className="h-32 md:hidden" />
      </main>
    </div>
  );
};

export default Profile;
