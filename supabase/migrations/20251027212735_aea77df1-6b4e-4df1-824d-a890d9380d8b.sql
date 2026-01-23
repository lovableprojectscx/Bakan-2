-- Create enums for better data integrity
CREATE TYPE public.app_role AS ENUM ('usuario', 'admin');
CREATE TYPE public.estado_cuenta AS ENUM ('activo', 'suspendido');
CREATE TYPE public.estado_verificacion AS ENUM ('no_verificado', 'pendiente_revision', 'verificado');
CREATE TYPE public.tipo_cuenta_bancaria AS ENUM ('ahorros', 'corriente', 'celular');
CREATE TYPE public.tipo_producto AS ENUM ('fisico', 'digital');
CREATE TYPE public.estado_transaccion AS ENUM ('iniciada', 'pendiente_pago', 'pago_en_verificacion', 'pagada_retenida', 'enviado', 'completada', 'en_disputa', 'cancelada', 'cancelada_automatico');
CREATE TYPE public.estado_pago_vendedor AS ENUM ('pendiente_de_pago', 'en_proceso', 'pagado');
CREATE TYPE public.tipo_mensaje AS ENUM ('usuario_normal', 'sistema_automatico', 'sistema_admin');
CREATE TYPE public.tipo_prueba AS ENUM ('voucher_pago', 'prueba_envio', 'video_empaquetado', 'video_unboxing', 'screencast_digital');
CREATE TYPE public.estado_disputa AS ENUM ('abierta', 'en_investigacion', 'resuelta');
CREATE TYPE public.reembolso_estado AS ENUM ('pendiente_devolucion', 'completado');

-- 1. Profiles table (connected to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  telefono TEXT,
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  estado_cuenta estado_cuenta DEFAULT 'activo',
  estado_verificacion estado_verificacion DEFAULT 'no_verificado',
  documento_identidad_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. User Roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 3. Perfiles Financieros
CREATE TABLE public.perfiles_financieros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  banco TEXT NOT NULL,
  numero_cuenta TEXT NOT NULL,
  tipo_cuenta tipo_cuenta_bancaria NOT NULL,
  esta_activo BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Transacciones
CREATE TABLE public.transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_invitacion TEXT UNIQUE NOT NULL,
  vendedor_id UUID REFERENCES public.profiles(id) NOT NULL,
  comprador_id UUID REFERENCES public.profiles(id),
  titulo_producto TEXT NOT NULL,
  descripcion TEXT,
  precio_producto DECIMAL(10,2) NOT NULL,
  comision_bakan DECIMAL(10,2) NOT NULL,
  monto_a_liberar DECIMAL(10,2) NOT NULL,
  tipo_producto tipo_producto NOT NULL,
  estado estado_transaccion DEFAULT 'iniciada',
  admin_id_verificador UUID REFERENCES public.profiles(id),
  admin_id_mediador UUID REFERENCES public.profiles(id),
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fecha_pago TIMESTAMP WITH TIME ZONE,
  fecha_envio TIMESTAMP WITH TIME ZONE,
  fecha_liberacion TIMESTAMP WITH TIME ZONE,
  estado_pago_vendedor estado_pago_vendedor DEFAULT 'pendiente_de_pago',
  voucher_pago_vendedor_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Mensajes
CREATE TABLE public.mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaccion_id UUID REFERENCES public.transacciones(id) ON DELETE CASCADE NOT NULL,
  emisor_id UUID REFERENCES public.profiles(id) NOT NULL,
  contenido TEXT NOT NULL,
  tipo_mensaje tipo_mensaje DEFAULT 'usuario_normal',
  url_archivo TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Pruebas Transacción
CREATE TABLE public.pruebas_transaccion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaccion_id UUID REFERENCES public.transacciones(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES public.profiles(id) NOT NULL,
  tipo_prueba tipo_prueba NOT NULL,
  url_archivo TEXT NOT NULL,
  descripcion TEXT,
  fecha_carga TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Disputas
CREATE TABLE public.disputas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaccion_id UUID REFERENCES public.transacciones(id) ON DELETE CASCADE NOT NULL,
  reportante_id UUID REFERENCES public.profiles(id) NOT NULL,
  motivo TEXT NOT NULL,
  estado_disputa estado_disputa DEFAULT 'abierta',
  resolucion_final TEXT,
  reembolso_banco_comprador TEXT,
  reembolso_cuenta_comprador TEXT,
  reembolso_estado reembolso_estado DEFAULT 'pendiente_devolucion',
  reembolso_voucher_url TEXT,
  fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fecha_cierre TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Cuentas Bancarias Bakan
CREATE TABLE public.cuentas_bancarias_bakan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banco TEXT NOT NULL,
  numero_cuenta_o_celular TEXT NOT NULL,
  titular TEXT NOT NULL,
  instrucciones_adicionales TEXT,
  esta_activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Registros Admin
CREATE TABLE public.registros_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) NOT NULL,
  transaccion_id UUID REFERENCES public.transacciones(id),
  usuario_afectado_id UUID REFERENCES public.profiles(id),
  accion_realizada TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. Calificaciones
CREATE TABLE public.calificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaccion_id UUID REFERENCES public.transacciones(id) ON DELETE CASCADE NOT NULL,
  calificador_id UUID REFERENCES public.profiles(id) NOT NULL,
  calificado_id UUID REFERENCES public.profiles(id) NOT NULL,
  puntuacion INTEGER CHECK (puntuacion >= 1 AND puntuacion <= 5) NOT NULL,
  comentario TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(transaccion_id, calificador_id)
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_estado_verificacion ON public.profiles(estado_verificacion);
CREATE INDEX idx_transacciones_vendedor ON public.transacciones(vendedor_id);
CREATE INDEX idx_transacciones_comprador ON public.transacciones(comprador_id);
CREATE INDEX idx_transacciones_estado ON public.transacciones(estado);
CREATE INDEX idx_transacciones_codigo ON public.transacciones(codigo_invitacion);
CREATE INDEX idx_mensajes_transaccion ON public.mensajes(transaccion_id);
CREATE INDEX idx_mensajes_timestamp ON public.mensajes(timestamp);
CREATE INDEX idx_disputas_transaccion ON public.disputas(transaccion_id);
CREATE INDEX idx_calificaciones_calificado ON public.calificaciones(calificado_id);

-- Function to check user roles (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_perfiles_financieros_updated_at
  BEFORE UPDATE ON public.perfiles_financieros
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transacciones_updated_at
  BEFORE UPDATE ON public.transacciones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_disputas_updated_at
  BEFORE UPDATE ON public.disputas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cuentas_bancarias_bakan_updated_at
  BEFORE UPDATE ON public.cuentas_bancarias_bakan
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre_completo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', 'Usuario')
  );
  
  -- Assign default 'usuario' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'usuario');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_financieros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pruebas_transaccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas_bancarias_bakan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calificaciones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for perfiles_financieros
CREATE POLICY "Users can view their own financial profiles"
  ON public.perfiles_financieros FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own financial profiles"
  ON public.perfiles_financieros FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own financial profiles"
  ON public.perfiles_financieros FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own financial profiles"
  ON public.perfiles_financieros FOR DELETE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Admins can view all financial profiles"
  ON public.perfiles_financieros FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for transacciones
CREATE POLICY "Users can view their own transactions"
  ON public.transacciones FOR SELECT
  USING (
    auth.uid() = vendedor_id OR 
    auth.uid() = comprador_id OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create transactions as seller"
  ON public.transacciones FOR INSERT
  WITH CHECK (auth.uid() = vendedor_id);

CREATE POLICY "Users can update their transactions"
  ON public.transacciones FOR UPDATE
  USING (
    auth.uid() = vendedor_id OR 
    auth.uid() = comprador_id OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage all transactions"
  ON public.transacciones FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for mensajes
CREATE POLICY "Users can view messages from their transactions"
  ON public.mensajes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transacciones
      WHERE id = mensajes.transaccion_id
      AND (vendedor_id = auth.uid() OR comprador_id = auth.uid())
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can send messages to their transactions"
  ON public.mensajes FOR INSERT
  WITH CHECK (
    auth.uid() = emisor_id AND
    EXISTS (
      SELECT 1 FROM public.transacciones
      WHERE id = mensajes.transaccion_id
      AND (vendedor_id = auth.uid() OR comprador_id = auth.uid())
    )
  );

CREATE POLICY "Admins can send messages to any transaction"
  ON public.mensajes FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pruebas_transaccion
CREATE POLICY "Users can view proofs from their transactions"
  ON public.pruebas_transaccion FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transacciones
      WHERE id = pruebas_transaccion.transaccion_id
      AND (vendedor_id = auth.uid() OR comprador_id = auth.uid())
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can upload proofs to their transactions"
  ON public.pruebas_transaccion FOR INSERT
  WITH CHECK (
    auth.uid() = usuario_id AND
    EXISTS (
      SELECT 1 FROM public.transacciones
      WHERE id = pruebas_transaccion.transaccion_id
      AND (vendedor_id = auth.uid() OR comprador_id = auth.uid())
    )
  );

-- RLS Policies for disputas
CREATE POLICY "Users can view their disputes"
  ON public.disputas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transacciones
      WHERE id = disputas.transaccion_id
      AND (vendedor_id = auth.uid() OR comprador_id = auth.uid())
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create disputes for their transactions"
  ON public.disputas FOR INSERT
  WITH CHECK (
    auth.uid() = reportante_id AND
    EXISTS (
      SELECT 1 FROM public.transacciones
      WHERE id = disputas.transaccion_id
      AND (vendedor_id = auth.uid() OR comprador_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage all disputes"
  ON public.disputas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for cuentas_bancarias_bakan
CREATE POLICY "Everyone can view active Bakan bank accounts"
  ON public.cuentas_bancarias_bakan FOR SELECT
  USING (esta_activa = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage Bakan bank accounts"
  ON public.cuentas_bancarias_bakan FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for registros_admin
CREATE POLICY "Only admins can view admin logs"
  ON public.registros_admin FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert admin logs"
  ON public.registros_admin FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

-- RLS Policies for calificaciones
CREATE POLICY "Users can view ratings for transactions they're part of"
  ON public.calificaciones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transacciones
      WHERE id = calificaciones.transaccion_id
      AND (vendedor_id = auth.uid() OR comprador_id = auth.uid())
    ) OR 
    auth.uid() = calificado_id OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can rate their completed transactions"
  ON public.calificaciones FOR INSERT
  WITH CHECK (
    auth.uid() = calificador_id AND
    EXISTS (
      SELECT 1 FROM public.transacciones
      WHERE id = calificaciones.transaccion_id
      AND (vendedor_id = auth.uid() OR comprador_id = auth.uid())
      AND estado = 'completada'
    )
  );