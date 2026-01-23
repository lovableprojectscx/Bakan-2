import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Send, Paperclip, Image as ImageIcon, Trash2, Package, Truck, Hash, FileText, Files } from 'lucide-react';
import { cn } from '@/lib/utils';

// Componente para renderizar notificaciones de envío de forma bonita
const ShippingNotification = ({ content }: { content: string }) => {
  // Detectar si es una notificación de envío
  const isShippingNotification = content.includes('El vendedor ha enviado el producto') || 
                                  content.includes('vendedor ha enviado');
  
  if (!isShippingNotification) {
    return <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{content}</p>;
  }

  // Parsear los datos de la notificación
  const empresaMatch = content.match(/\*\*Empresa de envío:\*\*\s*([^\n🔢]*)/);
  const codigoMatch = content.match(/\*\*Código de seguimiento:\*\*\s*([^\n📝]*)/);
  const detallesMatch = content.match(/\*\*Detalles adicionales:\*\*\s*([^\n📎]*)/);
  const archivosMatch = content.match(/Se adjuntaron?\s*(\d+)\s*archivo/);

  const empresa = empresaMatch?.[1]?.trim() || '';
  const codigo = codigoMatch?.[1]?.trim() || '';
  const detalles = detallesMatch?.[1]?.trim() || '';
  const numArchivos = archivosMatch?.[1] || '0';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 bg-green-500/20 rounded-full">
          <Package className="w-5 h-5 text-green-600" />
        </div>
        <span className="font-semibold text-green-700 dark:text-green-400">
          ¡Producto Enviado!
        </span>
      </div>

      {/* Detalles del envío */}
      <div className="bg-background/50 rounded-lg p-3 space-y-2 border border-border/50">
        {empresa && (
          <div className="flex items-center gap-3">
            <Truck className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Empresa de envío</p>
              <p className="text-sm font-medium">{empresa}</p>
            </div>
          </div>
        )}

        {codigo && (
          <div className="flex items-center gap-3">
            <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Código de seguimiento</p>
              <p className="text-sm font-medium font-mono bg-muted px-2 py-0.5 rounded inline-block">{codigo}</p>
            </div>
          </div>
        )}

        {detalles && (
          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Detalles adicionales</p>
              <p className="text-sm">{detalles}</p>
            </div>
          </div>
        )}

        {parseInt(numArchivos) > 0 && (
          <div className="flex items-center gap-3 pt-1 border-t border-border/50">
            <Files className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-primary font-medium">
              {numArchivos} prueba{parseInt(numArchivos) > 1 ? 's' : ''} de envío adjunta{parseInt(numArchivos) > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface Mensaje {
  id: string;
  transaccion_id: string;
  emisor_id: string;
  contenido: string;
  tipo_mensaje: string;
  url_archivo: string | null;
  timestamp: string;
}

interface TransactionChatProps {
  transaccionId: string;
  userId: string;
  estadoTransaccion: string;
}

export const TransactionChat = ({ transaccionId, userId, estadoTransaccion }: TransactionChatProps) => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [eliminandoChat, setEliminandoChat] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMensajes();

    // Set up realtime subscription
    const channel = supabase
      .channel(`mensajes-${transaccionId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: userId }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `transaccion_id=eq.${transaccionId}`
        },
        (payload) => {
          setMensajes(prev => {
            // Evitar duplicados
            const exists = prev.some(m => m.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new as Mensaje];
          });
          setTimeout(() => scrollToBottom(), 100);
        }
      )
      .subscribe((status) => {
        console.log('Chat subscription status:', status);
      });

    // Polling como respaldo para móviles (cada 5 segundos)
    const pollingInterval = setInterval(() => {
      fetchMensajes();
    }, 5000);

    // Refetch cuando la app vuelve a estar visible (importante para móviles)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMensajes();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollingInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [transaccionId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  };

  const fetchMensajes = async () => {
    try {
      const { data, error } = await supabase
        .from('mensajes')
        .select('*')
        .eq('transaccion_id', transaccionId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      
      // Solo actualizar si hay cambios reales
      setMensajes(prev => {
        if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
        return data || [];
      });
      
      setTimeout(() => scrollToBottom(), 100);
    } catch (error: any) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoMensaje.trim()) return;

    setEnviando(true);
    try {
      const { error } = await supabase
        .from('mensajes')
        .insert({
          transaccion_id: transaccionId,
          emisor_id: userId,
          contenido: nuevoMensaje.trim(),
          tipo_mensaje: 'usuario_normal'
        });

      if (error) throw error;
      setNuevoMensaje('');
    } catch (error: any) {
      toast.error('Error al enviar mensaje: ' + error.message);
    } finally {
      setEnviando(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10485760) {
      toast.error('El archivo es muy grande. Máximo 10MB');
      return;
    }

    setArchivoSeleccionado(file);
  };

  const cancelarArchivo = () => {
    setArchivoSeleccionado(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const enviarArchivo = async () => {
    if (!archivoSeleccionado) return;

    setSubiendoArchivo(true);
    try {
      // Upload to storage
      const fileExt = archivoSeleccionado.name.split('.').pop();
      const fileName = `${userId}/${transaccionId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('mensajes-archivos')
        .upload(fileName, archivoSeleccionado);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('mensajes-archivos')
        .getPublicUrl(fileName);

      // Send message with file
      const { error: messageError } = await supabase
        .from('mensajes')
        .insert({
          transaccion_id: transaccionId,
          emisor_id: userId,
          contenido: `📎 ${archivoSeleccionado.name}`,
          tipo_mensaje: 'usuario_normal',
          url_archivo: publicUrl
        });

      if (messageError) throw messageError;
      
      toast.success('Archivo enviado correctamente');
      setArchivoSeleccionado(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      toast.error('Error al subir archivo: ' + error.message);
    } finally {
      setSubiendoArchivo(false);
    }
  };

  const eliminarChat = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar todos los mensajes del chat? Esta acción no se puede deshacer.')) {
      return;
    }

    setEliminandoChat(true);
    try {
      const { error } = await supabase
        .from('mensajes')
        .delete()
        .eq('transaccion_id', transaccionId);

      if (error) throw error;

      toast.success('Chat eliminado correctamente');
      setMensajes([]);
    } catch (error: any) {
      toast.error('Error al eliminar chat: ' + error.message);
    } finally {
      setEliminandoChat(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) + ' ' + 
             date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const puedeEliminarChat = ['iniciada', 'pendiente_pago'].includes(estadoTransaccion);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 min-h-0" 
        style={{ 
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}
      >
        {mensajes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No hay mensajes aún. ¡Inicia la conversación!</p>
          </div>
        ) : (
          mensajes.map((mensaje) => {
            const esMio = mensaje.emisor_id === userId;
            const esSistema = mensaje.tipo_mensaje !== 'usuario_normal';

            if (esSistema) {
              const isShippingNotification = mensaje.contenido.includes('El vendedor ha enviado el producto') || 
                                              mensaje.contenido.includes('vendedor ha enviado');
              
              return (
                <div key={mensaje.id} className="flex justify-center my-4">
                  <div className={cn(
                    "px-5 py-4 rounded-xl shadow-md max-w-[90%] border-2",
                    isShippingNotification 
                      ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-400/50"
                      : "bg-primary/10 border-primary"
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        isShippingNotification ? "bg-green-500" : "bg-primary"
                      )}></div>
                      <span className={cn(
                        "text-xs font-semibold uppercase tracking-wide",
                        isShippingNotification ? "text-green-600 dark:text-green-400" : "text-primary"
                      )}>
                        Notificación del Sistema
                      </span>
                    </div>
                    <ShippingNotification content={mensaje.contenido} />
                  </div>
                </div>
              );
            }

            return (
              <div
                key={mensaje.id}
                className={cn(
                  'flex',
                  esMio ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-2',
                    esMio
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}
                >
                  <p className="text-sm break-words">{mensaje.contenido}</p>
                  {mensaje.url_archivo && (
                    <div className="mt-2 max-w-full">
                      {mensaje.url_archivo.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <div className="space-y-2">
                          <img
                            src={mensaje.url_archivo}
                            alt="Imagen adjunta"
                            className="w-full rounded-lg border border-border max-h-48 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(mensaje.url_archivo!, '_blank')}
                          />
                          <a
                            href={mensaje.url_archivo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs underline hover:opacity-80"
                          >
                            <ImageIcon className="w-3 h-3" />
                            Abrir en nueva pestaña
                          </a>
                        </div>
                      ) : (
                        <a
                          href={mensaje.url_archivo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs underline hover:opacity-80"
                        >
                          <Paperclip className="w-3 h-3" />
                          Ver archivo adjunto
                        </a>
                      )}
                    </div>
                  )}
                  <p className={cn(
                    'text-xs mt-1',
                    esMio ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}>
                    {formatTimestamp(mensaje.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4 shrink-0">
        {puedeEliminarChat && mensajes.length > 0 && (
          <div className="mb-3">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={eliminarChat}
              disabled={eliminandoChat}
              className="w-full"
            >
              {eliminandoChat ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Chat
                </>
              )}
            </Button>
          </div>
        )}

        {/* Vista previa de archivo seleccionado */}
        {archivoSeleccionado && (
          <div className="mb-3 p-3 border rounded-lg bg-muted">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Paperclip className="w-4 h-4 shrink-0" />
                <span className="text-sm truncate">{archivoSeleccionado.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  ({(archivoSeleccionado.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  onClick={enviarArchivo}
                  disabled={subiendoArchivo}
                >
                  {subiendoArchivo ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1" />
                      Enviar
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelarArchivo}
                  disabled={subiendoArchivo}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={enviarMensaje} className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={subiendoArchivo || !!archivoSeleccionado}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            placeholder="Escribe un mensaje..."
            disabled={enviando || !!archivoSeleccionado}
          />
          <Button
            type="submit"
            size="icon"
            disabled={enviando || !nuevoMensaje.trim() || !!archivoSeleccionado}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
