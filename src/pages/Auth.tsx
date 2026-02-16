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
import { Lock, Mail, User, ArrowLeft, Eye, EyeOff } from 'lucide-react';
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

const updatePasswordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(72, 'La contraseña es muy larga'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

const Auth = () => {
  const { signUp, signIn, signInWithGoogle, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isProcessingCode, setIsProcessingCode] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPasswordSignin, setShowPasswordSignin] = useState(false);
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);
  const [showPasswordSignupConfirm, setShowPasswordSignupConfirm] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showPasswordResetConfirm, setShowPasswordResetConfirm] = useState(false);

  const invitationCode = searchParams.get('code');
  const isResetMode = searchParams.get('mode') === 'reset';

  useEffect(() => {
    // Check for errors in the URL hash (from Supabase redirects)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const error = hashParams.get('error');
    const errorDescription = hashParams.get('error_description');

    if (error) {
      setAuthError(errorDescription || 'Ha ocurrido un error de autenticación');
      // Clean URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);


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

  // Redirect if already logged in (but not with invitation code AND not resetting password)
  useEffect(() => {
    if (user && !invitationCode && !isProcessingCode && !isResetMode) {
      navigate('/dashboard');
    }
  }, [user, invitationCode, navigate, isProcessingCode, isResetMode]);

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

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string
    };

    try {
      const validated = updatePasswordSchema.parse(data);
      const { error } = await supabase.auth.updateUser({ password: validated.password });

      if (error) {
        toast.error('Error al actualizar la contraseña: ' + error.message);
      } else {
        toast.success('Contraseña actualizada correctamente');
        // Clear param/mode and redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md shadow-strong border-2 border-destructive/20">
          <CardHeader className="space-y-4">
            <div className="flex justify-center bg-destructive/10 w-16 h-16 rounded-full items-center mx-auto mb-2">
              <Lock className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl text-center text-destructive">Enlace Expirado o Inválido</CardTitle>
            <CardDescription className="text-center text-balance">
              {authError}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex-col gap-3">
            <p className="text-sm text-center text-muted-foreground">
              Los enlaces de seguridad tienen un tiempo límite. Por favor, solicita uno nuevo.
            </p>
            <Button onClick={() => {
              setAuthError(null);
              setShowResetPassword(true);
              navigate('/auth');
            }} className="w-full">
              Solicitar nuevo enlace
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isResetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="w-full max-w-md shadow-strong border-2">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <img src={logo} alt="Bakan Logo" className="h-16" />
            </div>
            <CardTitle className="text-2xl text-center">Nueva Contraseña</CardTitle>
            <CardDescription className="text-center">
              Ingresa tu nueva contraseña para segura tu cuenta
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdatePassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    name="password"
                    type={showPasswordReset ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(!showPasswordReset)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPasswordReset ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-new-password"
                    name="confirmPassword"
                    type={showPasswordResetConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordResetConfirm(!showPasswordResetConfirm)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPasswordResetConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

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
                      type={showPasswordSignin ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordSignin(!showPasswordSignin)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPasswordSignin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
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

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 h-10 shadow-sm transition-all hover:bg-secondary/50 group"
                  onClick={() => signInWithGoogle()}
                  disabled={loading}
                >
                  <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Google</span>
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
                      type={showPasswordSignup ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-9"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordSignup(!showPasswordSignup)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPasswordSignup ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-confirm-password" className="text-xs">Confirmar contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm-password"
                      name="confirmPassword"
                      type={showPasswordSignupConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-9"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordSignupConfirm(!showPasswordSignupConfirm)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPasswordSignupConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full shadow-soft h-10" disabled={loading}>
                  {loading ? 'Registrando...' : 'Crear Cuenta'}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 h-10 shadow-sm transition-all hover:bg-secondary/50 group"
                  onClick={() => signInWithGoogle()}
                  disabled={loading}
                >
                  <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Google</span>
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
