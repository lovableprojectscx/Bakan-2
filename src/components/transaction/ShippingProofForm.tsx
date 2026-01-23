import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, X, Truck, Package, FileVideo, Image, File } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ShippingProofFormProps {
  transaccionId: string;
  userId: string;
  onSuccess: () => void;
}

interface ArchivoSeleccionado {
  file: File;
  tipo: 'imagen' | 'video' | 'documento';
}

export const ShippingProofForm = ({ transaccionId, userId, onSuccess }: ShippingProofFormProps) => {
  const [archivos, setArchivos] = useState<ArchivoSeleccionado[]>([]);
  const [detallesEnvio, setDetallesEnvio] = useState('');
  const [codigoSeguimiento, setCodigoSeguimiento] = useState('');
  const [empresaEnvio, setEmpresaEnvio] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  const getTipoArchivo = (file: File): 'imagen' | 'video' | 'documento' => {
    if (file.type.startsWith('image/')) return 'imagen';
    if (file.type.startsWith('video/')) return 'video';
    return 'documento';
  };

  const getIconoArchivo = (tipo: 'imagen' | 'video' | 'documento') => {
    switch (tipo) {
      case 'imagen': return <Image className="w-4 h-4" />;
      case 'video': return <FileVideo className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  const MAX_FILES = 10; // Maximum number of files allowed

  const handleArchivosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Check if adding new files would exceed the limit
    const espacioDisponible = MAX_FILES - archivos.length;
    if (espacioDisponible <= 0) {
      toast.error(`Máximo ${MAX_FILES} archivos permitidos`);
      e.target.value = '';
      return;
    }

    const nuevosArchivos: ArchivoSeleccionado[] = [];
    for (let i = 0; i < Math.min(files.length, espacioDisponible); i++) {
      const file = files[i];
      // Limit file size: 50MB for videos, 10MB for others
      const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      
      if (file.size > maxSize) {
        toast.error(`${file.name} excede el tamaño máximo permitido`);
        continue;
      }

      nuevosArchivos.push({
        file,
        tipo: getTipoArchivo(file)
      });
    }

    if (files.length > espacioDisponible) {
      toast.warning(`Solo se agregaron ${espacioDisponible} archivo(s). Límite: ${MAX_FILES}`);
    }

    setArchivos(prev => [...prev, ...nuevosArchivos]);
    e.target.value = '';
  };

  const eliminarArchivo = (index: number) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const formatearTamano = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async () => {
    if (archivos.length === 0 && !detallesEnvio.trim() && !codigoSeguimiento.trim()) {
      toast.error('Debes agregar al menos una prueba de envío o detalles del envío');
      return;
    }

    setSubiendo(true);

    try {
      const urlsArchivos: string[] = [];

      // Upload all files
      for (const archivo of archivos) {
        const fileExt = archivo.file.name.split('.').pop();
        // CRITICAL: Folder structure must be userId/transaccionId/file for RLS to work
        const fileName = `${userId}/${transaccionId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('pruebas-envio')
          .upload(fileName, archivo.file);

        if (uploadError) throw uploadError;

        // Get signed URL for private bucket
        const { data: signedData } = await supabase.storage
          .from('pruebas-envio')
          .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

        if (signedData?.signedUrl) {
          urlsArchivos.push(signedData.signedUrl);

          // Record in pruebas_transaccion
          const tipoPrueba = archivo.tipo === 'video' ? 'video_empaquetado' : 'prueba_envio';
          await supabase.from('pruebas_transaccion').insert([{
            transaccion_id: transaccionId,
            usuario_id: userId,
            tipo_prueba: tipoPrueba,
            url_archivo: signedData.signedUrl,
            descripcion: archivo.tipo === 'video' ? 'Video de prueba de envío' : 'Foto de prueba de envío'
          }]);
        }
      }

      // Build shipping details message
      let mensajeEnvio = '📦 **El vendedor ha enviado el producto**\n\n';
      
      if (empresaEnvio.trim()) {
        mensajeEnvio += `🚚 **Empresa de envío:** ${empresaEnvio}\n`;
      }
      
      if (codigoSeguimiento.trim()) {
        mensajeEnvio += `🔢 **Código de seguimiento:** ${codigoSeguimiento}\n`;
      }
      
      if (detallesEnvio.trim()) {
        mensajeEnvio += `\n📝 **Detalles adicionales:**\n${detallesEnvio}\n`;
      }

      if (urlsArchivos.length > 0) {
        mensajeEnvio += `\n📎 Se adjuntaron ${urlsArchivos.length} archivo(s) como prueba de envío.`;
      }

      // Update transaction status
      const { error: updateError } = await supabase
        .from('transacciones')
        .update({ 
          estado: 'enviado',
          fecha_envio: new Date().toISOString()
        })
        .eq('id', transaccionId);

      if (updateError) throw updateError;

      // Send system message with shipping details
      await supabase.from('mensajes').insert([{
        transaccion_id: transaccionId,
        emisor_id: userId,
        contenido: mensajeEnvio,
        tipo_mensaje: 'sistema_automatico'
      }]);

      toast.success('¡Producto marcado como enviado!');
      onSuccess();
    } catch (error: any) {
      toast.error('Error al enviar: ' + error.message);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Shipping Company */}
      <div className="space-y-2">
        <Label htmlFor="empresa-envio">Empresa de envío (opcional)</Label>
        <Input
          id="empresa-envio"
          placeholder="Ej: Olva Courier, Shalom, Cruz del Sur..."
          value={empresaEnvio}
          onChange={(e) => setEmpresaEnvio(e.target.value)}
          disabled={subiendo}
        />
      </div>

      {/* Tracking Code */}
      <div className="space-y-2">
        <Label htmlFor="codigo-seguimiento">Código de seguimiento (opcional)</Label>
        <Input
          id="codigo-seguimiento"
          placeholder="Ej: ABC123456789"
          value={codigoSeguimiento}
          onChange={(e) => setCodigoSeguimiento(e.target.value)}
          disabled={subiendo}
        />
      </div>

      {/* Additional Details */}
      <div className="space-y-2">
        <Label htmlFor="detalles-envio">Detalles adicionales (opcional)</Label>
        <Textarea
          id="detalles-envio"
          placeholder="Agrega cualquier información importante: hora estimada de entrega, instrucciones especiales, etc."
          value={detallesEnvio}
          onChange={(e) => setDetallesEnvio(e.target.value)}
          disabled={subiendo}
          rows={3}
        />
      </div>

      {/* File Upload */}
      <div className="space-y-3">
        <Label>Pruebas de envío (fotos, videos, comprobantes)</Label>
        <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            accept="image/*,video/*,.pdf"
            multiple
            onChange={handleArchivosChange}
            disabled={subiendo}
            className="hidden"
            id="archivos-envio"
          />
          <label htmlFor="archivos-envio" className="cursor-pointer block">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Click para subir o arrastra archivos aquí
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Imágenes, videos (máx 50MB) o PDFs (máx 10MB) • Máximo {MAX_FILES} archivos
            </p>
            {archivos.length > 0 && (
              <p className="text-xs text-primary mt-1 font-medium">
                {archivos.length}/{MAX_FILES} archivos seleccionados
              </p>
            )}
          </label>
        </div>

        {/* Selected Files List */}
        {archivos.length > 0 && (
          <div className="space-y-2">
            {archivos.map((archivo, index) => (
              <Card key={index} className="bg-muted/50">
                <CardContent className="py-2 px-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {getIconoArchivo(archivo.tipo)}
                    <span className="text-sm truncate">{archivo.file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatearTamano(archivo.file.size)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminarArchivo(index)}
                    disabled={subiendo}
                    className="h-6 w-6 p-0 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button 
        onClick={handleSubmit}
        disabled={subiendo}
        className="w-full h-12 text-base"
        size="lg"
      >
        {subiendo ? (
          <>
            <Package className="w-5 h-5 mr-2 animate-pulse" />
            Enviando...
          </>
        ) : (
          <>
            <Truck className="w-5 h-5 mr-2" />
            Confirmar Envío
          </>
        )}
      </Button>
    </div>
  );
};
