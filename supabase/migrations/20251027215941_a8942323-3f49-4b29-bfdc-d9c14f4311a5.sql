-- Tabla 11: Password Resets para recuperación de contraseña
CREATE TABLE public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para búsqueda rápida por email y token
CREATE INDEX idx_password_resets_email ON public.password_resets(email);
CREATE INDEX idx_password_resets_token ON public.password_resets(token);
CREATE INDEX idx_password_resets_expiracion ON public.password_resets(fecha_expiracion);

-- Índices faltantes para optimizar foreign keys
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_perfiles_financieros_usuario_id ON public.perfiles_financieros(usuario_id);
CREATE INDEX idx_transacciones_admin_verificador ON public.transacciones(admin_id_verificador);
CREATE INDEX idx_transacciones_admin_mediador ON public.transacciones(admin_id_mediador);
CREATE INDEX idx_mensajes_emisor ON public.mensajes(emisor_id);
CREATE INDEX idx_pruebas_transaccion_transaccion ON public.pruebas_transaccion(transaccion_id);
CREATE INDEX idx_pruebas_transaccion_usuario ON public.pruebas_transaccion(usuario_id);
CREATE INDEX idx_disputas_reportante ON public.disputas(reportante_id);
CREATE INDEX idx_registros_admin_admin ON public.registros_admin(admin_id);
CREATE INDEX idx_registros_admin_transaccion ON public.registros_admin(transaccion_id);
CREATE INDEX idx_registros_admin_usuario_afectado ON public.registros_admin(usuario_afectado_id);
CREATE INDEX idx_calificaciones_transaccion ON public.calificaciones(transaccion_id);
CREATE INDEX idx_calificaciones_calificador ON public.calificaciones(calificador_id);

-- Enable RLS en password_resets
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Solo el sistema puede gestionar tokens (no usuarios directos)
CREATE POLICY "System can manage password resets"
  ON public.password_resets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));