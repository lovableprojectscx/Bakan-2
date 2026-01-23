-- Crear políticas RLS para el bucket de mensajes-archivos
-- Permitir que los usuarios de una transacción puedan ver los archivos de sus mensajes

-- Política para ver archivos
CREATE POLICY "Users can view files from their transactions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'mensajes-archivos' AND
  (
    -- Extraer el user_id de la ruta del archivo (formato: user_id/transaction_id/filename)
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- O si el usuario es parte de la transacción
    EXISTS (
      SELECT 1 FROM transacciones t
      WHERE t.id::text = (storage.foldername(name))[2]
        AND (t.vendedor_id = auth.uid() OR t.comprador_id = auth.uid())
    )
  )
);

-- Política para subir archivos
CREATE POLICY "Users can upload files to their transactions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'mensajes-archivos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para eliminar archivos propios
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'mensajes-archivos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);