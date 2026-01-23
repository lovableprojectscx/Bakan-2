-- Hacer vendedor_id nullable para permitir que compradores inicien transacciones
ALTER TABLE public.transacciones 
ALTER COLUMN vendedor_id DROP NOT NULL;

-- Agregar constraint para asegurar que al menos uno de los dos esté presente
ALTER TABLE public.transacciones 
ADD CONSTRAINT at_least_one_party CHECK (
  vendedor_id IS NOT NULL OR comprador_id IS NOT NULL
);