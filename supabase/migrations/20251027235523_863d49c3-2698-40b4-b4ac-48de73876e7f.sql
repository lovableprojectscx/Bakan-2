-- Actualizar política de INSERT para permitir que tanto vendedores como compradores creen transacciones
DROP POLICY IF EXISTS "Users can create transactions as seller" ON public.transacciones;

CREATE POLICY "Users can create transactions" 
ON public.transacciones 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = vendedor_id OR auth.uid() = comprador_id
);