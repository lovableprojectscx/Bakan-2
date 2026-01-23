-- Hacer el bucket mensajes-archivos público para que las imágenes se puedan mostrar
UPDATE storage.buckets 
SET public = true 
WHERE id = 'mensajes-archivos';