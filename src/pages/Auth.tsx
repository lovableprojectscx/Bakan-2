import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { Lock, Mail, User, ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';

const signUpSchema = z.object({
  nombreCompleto: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre es muy largo').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre no puede contener números ni caracteres especiales'),
  telefono: z.string().trim().min(9, 'El teléfono debe tener al menos 9 dígitos').max(15, 'El teléfono es muy largo').regex(/^[0-9+\s-]+$/, 'El teléfono solo puede contener números, +, espacios y guiones'),
  email: z.string().trim().email('Correo electrónico inválido').max(255, 'El correo es muy largo'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(72, 'La contraseña es muy larga'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

const signInSchema = z.object({
  email: z.string().trim().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email('Correo electrónico inválido')
});

const Auth = () => {
  const { signUp, signIn, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isProcessingCode, setIsProcessingCode] = useState(false);

  const invitationCode = searchParams.get('code');

  // Handle automatic join if user is logged in and has code
  useEffect(() => {
    const autoJoinTransaction = async () => {
      if (user && invitationCode && !isProcessingCode) {
        setIsProcessingCode(true);
        try {
          const { data: transactionId, error } = await supabase.rpc('join_transaction_by_code', {
            _code: invitationCode
          });

          if (error) {
            if (error.message.includes('INVALID_CODE')) {
              toast.error('Código de invitación inválido');
            } else if (error.message.includes('ALREADY_COMPLETE')) {
              toast.error('Esta transacción ya tiene ambas partes');
            } else if (error.message.includes('OWN_TRANSACTION')) {
              toast.error('No puedes unirte a tu propia transacción');
            } else {
              toast.error('Error al unirse: ' + error.message);
            }
            navigate('/dashboard');
          } else {
            toast.success('¡Te uniste a la transacción!');
            navigate(`/transaction/${transactionId}`);
          }
        } catch (err: any) {
          toast.error('Error: ' + err.message);
          navigate('/dashboard');
        }
      }
    };

    autoJoinTransaction();
  }, [user, invitationCode, navigate, isProcessingCode]);

  // Redirect if already logged in (but not with invitation code)
  useEffect(() => {
    if (user && !invitationCode && !isProcessingCode) {
      navigate('/dashboard');
    }
  }, [user, invitationCode, navigate, isProcessingCode]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      nombreCompleto: formData.get('nombreCompleto') as string,
      telefono: formData.get('telefono') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string
    };

    try {
      const validated = signUpSchema.parse(data);
      const { error } = await signUp(validated.email, validated.password, validated.nombreCompleto, validated.telefono);

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Este correo ya está registrado. Intenta iniciar sesión.');
        } else {
          toast.error(error.message || 'Error al registrarse');
        }
        setLoading(false);
      }
      // No navegamos aquí - dejamos que el useEffect maneje la navegación con el código
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string
    };

    try {
      const validated = signInSchema.parse(data);
      const { error } = await signIn(validated.email, validated.password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Correo o contraseña incorrectos');
        } else {
          toast.error(error.message || 'Error al iniciar sesión');
        }
        setLoading(false);
      }
      // No navegamos aquí - dejamos que AuthContext o el useEffect manejen la navegación
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get('email') as string
    };

    try {
      const validated = resetPasswordSchema.parse(data);
      const { error } = await resetPassword(validated.email);

      if (error) {
        toast.error(error.message || 'Error al enviar el correo de recuperación');
      } else {
        setShowResetPassword(false);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md shadow-strong border-2">
          <CardHeader className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit"
              onClick={() => setShowResetPassword(false)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="flex justify-center">
              <img src={logo} alt="Bakan Logo" className="h-16" />
            </div>
            <CardTitle className="text-2xl text-center">Recuperar Contraseña</CardTitle>
            <CardDescription className="text-center">
              Ingresa tu correo y te enviaremos un link para restablecer tu contraseña
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    name="email"
                    type="email"
                    placeholder="tu@correo.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar correo de recuperación'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <Card className="w-full max-w-md shadow-strong border-2">
        <CardHeader className="space-y-2 pb-2">
          <div className="flex justify-center">
            <img src={logo} alt="Bakan Logo" className="h-12" />
          </div>
          <CardTitle className="text-xl text-center">
            {invitationCode ? 'Únete a la Transacción' : 'Bienvenido a Bakan'}
          </CardTitle>
          <CardDescription className="text-center text-xs">
            {invitationCode
              ? 'Inicia sesión o regístrate para unirte a la transacción'
              : 'La plataforma más segura para tus transacciones'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="tu@correo.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => setShowResetPassword(true)}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
                <Button type="submit" className="w-full shadow-soft" disabled={loading}>
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3 mt-4">
                <div className="space-y-1">
                  <Label htmlFor="signup-name" className="text-xs">Nombre completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      name="nombreCompleto"
                      type="text"
                      placeholder="Juan Pérez"
                      className="pl-10 h-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-telefono" className="text-xs">Número de celular</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-telefono"
                      name="telefono"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="912345678"
                      className="pl-10 h-9"
                      required
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-email" className="text-xs">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="tu@correo.com"
                      className="pl-10 h-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-xs">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-confirm-password" className="text-xs">Confirmar contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm-password"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-9"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full shadow-soft h-10" disabled={loading}>
                  {loading ? 'Registrando...' : 'Crear Cuenta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
