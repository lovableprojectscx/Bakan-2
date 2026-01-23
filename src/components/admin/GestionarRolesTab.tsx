import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, ShieldCheck, ShieldX, User, Crown, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserWithRole {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  email: string | null;
  isAdmin: boolean;
}

export const GestionarRolesTab = () => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    action: 'add' | 'remove';
  } | null>(null);

  const buscarUsuarios = async () => {
    if (!searchTerm.trim()) {
      toast.error('Ingresa un término de búsqueda');
      return;
    }

    setLoading(true);
    try {
      // Search profiles by name or phone
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nombre_completo, telefono')
        .or(`nombre_completo.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%`)
        .limit(20);

      if (profilesError) throw profilesError;

      // Also search by email using database function (only works for admins)
      const { data: emailResults } = await supabase
        .rpc('search_user_by_email', { _email: searchTerm });

      // Get profile data for users found by email
      let emailProfiles: typeof profiles = [];
      if (emailResults && emailResults.length > 0) {
        const emailUserIds = emailResults.map((e: { user_id: string }) => e.user_id);
        const { data: emailProfilesData } = await supabase
          .from('profiles')
          .select('id, nombre_completo, telefono')
          .in('id', emailUserIds);
        emailProfiles = emailProfilesData || [];
      }

      // Merge results, avoiding duplicates
      const allProfiles = [...(profiles || [])];
      for (const ep of emailProfiles) {
        if (!allProfiles.some(p => p.id === ep.id)) {
          allProfiles.push(ep);
        }
      }

      if (allProfiles.length === 0) {
        setUsers([]);
        toast.info('No se encontraron usuarios');
        return;
      }

      // Get roles for found users
      const userIds = allProfiles.map(p => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Create email map from search results
      const emailMap = new Map<string, string>();
      if (emailResults) {
        for (const er of emailResults) {
          emailMap.set(er.user_id, er.email);
        }
      }

      // Combine data
      const usersWithRoles: UserWithRole[] = allProfiles.map(profile => ({
        id: profile.id,
        nombre_completo: profile.nombre_completo,
        telefono: profile.telefono,
        email: emailMap.get(profile.id) || null,
        isAdmin: roles?.some(r => r.user_id === profile.id && r.role === 'admin') || false
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error('Error al buscar usuarios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleAction = (userId: string, userName: string, action: 'add' | 'remove') => {
    if (userId === currentUser?.id) {
      toast.error('No puedes modificar tu propio rol');
      return;
    }
    setConfirmDialog({ open: true, userId, userName, action });
  };

  const confirmarAccion = async () => {
    if (!confirmDialog) return;

    const { userId, action } = confirmDialog;
    setProcesando(userId);
    setConfirmDialog(null);

    try {
      if (action === 'add') {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });

        if (error) {
          if (error.code === '23505') {
            toast.error('El usuario ya tiene rol de administrador');
          } else {
            throw error;
          }
        } else {
          // Log admin action
          await supabase
            .from('registros_admin')
            .insert({
              admin_id: currentUser?.id,
              usuario_afectado_id: userId,
              accion_realizada: 'Otorgó rol de administrador'
            });

          toast.success('Rol de administrador otorgado exitosamente');
        }
      } else {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;

        // Log admin action
        await supabase
          .from('registros_admin')
          .insert({
            admin_id: currentUser?.id,
            usuario_afectado_id: userId,
            accion_realizada: 'Removió rol de administrador'
          });

        toast.success('Rol de administrador removido');
      }

      // Refresh search
      await buscarUsuarios();
    } catch (error: any) {
      toast.error('Error al modificar rol: ' + error.message);
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gestionar Roles</h2>
        <p className="text-muted-foreground">
          Busca usuarios y asigna o remueve el rol de administrador
        </p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Usuario
          </CardTitle>
          <CardDescription>
            Busca por nombre, teléfono o correo electrónico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Buscar</Label>
              <Input
                id="search"
                placeholder="Nombre, teléfono o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscarUsuarios()}
              />
            </div>
            <Button onClick={buscarUsuarios} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span className="ml-2">Buscar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {users.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Resultados ({users.length})</h3>
          
          {users.map((user) => (
            <Card key={user.id} className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      user.isAdmin 
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                        : 'bg-muted'
                    }`}>
                      {user.isAdmin ? (
                        <Crown className="w-6 h-6 text-white" />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{user.nombre_completo}</p>
                        {user.isAdmin && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                            Admin
                          </Badge>
                        )}
                        {user.id === currentUser?.id && (
                          <Badge variant="outline">Tú</Badge>
                        )}
                      </div>
                      {user.email && (
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      )}
                      {user.telefono && (
                        <p className="text-sm text-muted-foreground">Tel: {user.telefono}</p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono">{user.id}</p>
                    </div>
                  </div>

                  <div>
                    {user.id === currentUser?.id ? (
                      <Button variant="outline" disabled>
                        No disponible
                      </Button>
                    ) : user.isAdmin ? (
                      <Button
                        variant="destructive"
                        onClick={() => handleRoleAction(user.id, user.nombre_completo, 'remove')}
                        disabled={procesando === user.id}
                      >
                        {procesando === user.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ShieldX className="w-4 h-4 mr-2" />
                        )}
                        Quitar Admin
                      </Button>
                    ) : (
                      <Button
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        onClick={() => handleRoleAction(user.id, user.nombre_completo, 'add')}
                        disabled={procesando === user.id}
                      >
                        {procesando === user.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 mr-2" />
                        )}
                        Dar Admin
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === 'add' 
                ? '¿Otorgar rol de administrador?' 
                : '¿Remover rol de administrador?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === 'add' ? (
                <>
                  Estás a punto de otorgar permisos de administrador a <strong>{confirmDialog?.userName}</strong>. 
                  Tendrá acceso completo al panel de administración.
                </>
              ) : (
                <>
                  Estás a punto de remover los permisos de administrador de <strong>{confirmDialog?.userName}</strong>. 
                  Perderá el acceso al panel de administración.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmarAccion}
              className={confirmDialog?.action === 'remove' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
