import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ExternalLink, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const openDocumentoUrl = async (urlOrPath: string): Promise<void> => {
  try {
    // Check if it's already a full URL
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      // Try to extract file path from URL and create signed URL
      const parsed = new URL(urlOrPath);
      const marker = '/documentos-identidad/';
      const idx = parsed.pathname.indexOf(marker);
      
      if (idx !== -1) {
        const filePath = parsed.pathname.substring(idx + marker.length);
        const { data, error } = await supabase.storage
          .from('documentos-identidad')
          .createSignedUrl(filePath, 60 * 60); // 1 hour
        
        if (!error && data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
          return;
        }
      }
      
      // Fallback to original URL
      window.open(urlOrPath, '_blank');
      return;
    }
    
    // It's a file path, create signed URL
    const { data, error } = await supabase.storage
      .from('documentos-identidad')
      .createSignedUrl(urlOrPath, 60 * 60); // 1 hour
    
    if (error || !data?.signedUrl) {
      console.error('Error creating signed URL:', error);
      throw new Error('No se pudo acceder al documento');
    }
    
    window.open(data.signedUrl, '_blank');
  } catch (error) {
    console.error('Error opening document:', error);
    toast.error('Error al abrir el documento');
  }
};

interface Profile {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  documento_identidad_url: string | null;
  fecha_registro: string;
  estado_verificacion: string;
}

export const VerificarUsuariosTab = ({ onUpdate }: { onUpdate: () => void }) => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [abriendo, setAbriendo] = useState<string | null>(null);

  const handleVerDocumento = async (profileId: string, url: string) => {
    setAbriendo(profileId);
    try {
      await openDocumentoUrl(url);
    } finally {
      setAbriendo(null);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('estado_verificacion', 'pendiente_revision')
        .order('fecha_registro', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast.error('Error al cargar perfiles: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const verificarUsuario = async (profileId: string) => {
    setProcesando(profileId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ estado_verificacion: 'verificado' })
        .eq('id', profileId);

      if (error) throw error;

      // Log admin action
      await supabase
        .from('registros_admin')
        .insert({
          admin_id: user?.id,
          usuario_afectado_id: profileId,
          accion_realizada: 'Verificó usuario'
        });

      toast.success('Usuario verificado exitosamente');
      fetchProfiles();
      onUpdate();
    } catch (error: any) {
      toast.error('Error al verificar usuario: ' + error.message);
    } finally {
      setProcesando(null);
    }
  };

  const rechazarVerificacion = async (profileId: string) => {
    setProcesando(profileId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          estado_verificacion: 'no_verificado',
          documento_identidad_url: null
        })
        .eq('id', profileId);

      if (error) throw error;

      // Log admin action
      await supabase
        .from('registros_admin')
        .insert({
          admin_id: user?.id,
          usuario_afectado_id: profileId,
          accion_realizada: 'Rechazó verificación de usuario'
        });

      toast.success('Verificación rechazada');
      fetchProfiles();
      onUpdate();
    } catch (error: any) {
      toast.error('Error al rechazar verificación: ' + error.message);
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

  if (profiles.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Todo al día</h3>
        <p className="text-muted-foreground">
          No hay usuarios pendientes de verificación
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {profiles.map((profile) => (
        <Card key={profile.id} className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {profile.nombre_completo}
                </CardTitle>
                <CardDescription>
                  {profile.telefono && `Tel: ${profile.telefono}`}
                </CardDescription>
              </div>
              <Badge variant="secondary">Pendiente de revisión</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Registrado: {new Date(profile.fecha_registro).toLocaleDateString('es-ES')}
            </div>

            {profile.documento_identidad_url && (
              <div className="space-y-2">
                <p className="font-semibold text-sm">Documento de identidad:</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVerDocumento(profile.id, profile.documento_identidad_url!)}
                  disabled={abriendo === profile.id}
                >
                  {abriendo === profile.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4 mr-2" />
                  )}
                  Ver Documento
                </Button>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => verificarUsuario(profile.id)}
                disabled={procesando === profile.id}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Verificar Usuario
              </Button>
              <Button
                variant="destructive"
                onClick={() => rechazarVerificacion(profile.id)}
                disabled={procesando === profile.id}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
