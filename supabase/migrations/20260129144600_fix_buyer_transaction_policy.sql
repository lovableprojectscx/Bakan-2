-- Add policy to allow buyers to create transactions
-- This fixes the issue where "Quiero comprar" fails because the previous policy only allowed inserts where auth.uid() = vendedor_id

CREATE POLICY "Users can create transactions as buyer"
  ON public.transacciones FOR INSERT
  WITH CHECK (auth.uid() = comprador_id);
