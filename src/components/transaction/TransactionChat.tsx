import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Send, Paperclip, Image as ImageIcon, Trash2, Package, Truck, Hash, FileText, Files, MessageCircle, X } from 'lucide-react';
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

    // Validate file size (50MB)
    if (file.size > 52428800) {
      toast.error('El archivo es muy grande. Máximo 50MB');
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
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-background/5">
      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 min-h-0 scroll-smooth"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}
      >
        {mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center rotate-3">
              <MessageCircle className="w-8 h-8 text-primary/20" />
            </div>
            <p className="text-sm font-medium">Inicia la conversación</p>
          </div>
        ) : (
          mensajes.map((mensaje, index) => {
            const esMio = mensaje.emisor_id === userId;
            const esSistema = mensaje.tipo_mensaje !== 'usuario_normal';
            const showAvatar = index === 0 || mensajes[index - 1].emisor_id !== mensaje.emisor_id;

            if (esSistema) {
              const isShippingNotification = mensaje.contenido.includes('El vendedor ha enviado el producto') ||
                mensaje.contenido.includes('vendedor ha enviado');

              if (isShippingNotification) {
                return (
                  <div key={mensaje.id} className="flex justify-center my-6 px-4">
                    <div className="w-full max-w-sm bg-white dark:bg-card rounded-2xl shadow-sm border border-green-200/50 dark:border-green-900/50 overflow-hidden animate-in zoom-in-95 duration-300">
                      <div className="bg-green-50/50 dark:bg-green-950/20 p-3 flex items-center gap-3 border-b border-green-100 dark:border-green-900/30">
                        <div className="p-1.5 bg-green-500/10 rounded-full ring-1 ring-green-500/20">
                          <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">Actualización de Envío</span>
                      </div>
                      <div className="p-4">
                        <ShippingNotification content={mensaje.contenido} />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={mensaje.id} className="flex justify-center my-6">
                  <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 border border-border/40 rounded-full shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      {mensaje.contenido}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={mensaje.id}
                className={cn(
                  'flex items-end gap-2 animate-in slide-in-from-bottom-2 duration-300',
                  esMio ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[75%] px-4 py-2.5 shadow-sm relative group',
                    esMio
                      ? 'bg-gradient-to-tr from-primary to-blue-600 text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white dark:bg-card border border-border/40 text-foreground rounded-2xl rounded-tl-sm'
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">{mensaje.contenido}</p>

                  {/* Attachments rendering */}
                  {mensaje.url_archivo && (
                    <div className="mt-3 -mx-1 mb-1">
                      {mensaje.url_archivo.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <div className="relative group/image overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
                          <img
                            src={mensaje.url_archivo}
                            alt="Adjunto"
                            onClick={() => window.open(mensaje.url_archivo!, '_blank')}
                            className="w-full h-auto max-h-60 object-cover cursor-zoom-in transition-transform duration-500 group-hover/image:scale-105"
                          />
                        </div>
                      ) : (
                        <a
                          href={mensaje.url_archivo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl transition-colors",
                            esMio ? "bg-white/10 hover:bg-white/20 text-white" : "bg-muted/50 hover:bg-muted text-foreground"
                          )}
                        >
                          <div className={cn("p-2 rounded-lg", esMio ? "bg-white/10" : "bg-background shadow-sm")}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">Archivo Adjunto</p>
                            <span className="text-[10px] opacity-70">Clic para descargar</span>
                          </div>
                        </a>
                      )}
                    </div>
                  )}

                  <p className={cn(
                    'text-[10px] mt-1 text-right',
                    esMio ? 'text-white/70' : 'text-muted-foreground'
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
      <div className="p-4 bg-transparent shrink-0">
        <div className="max-w-3xl mx-auto space-y-4">


          {/* Floating Input Capsule */}
          <div className="relative bg-white dark:bg-card rounded-[2rem] shadow-lg shadow-black/5 border border-border/50 p-1.5 flex items-end gap-2 transition-all focus-within:ring-2 focus-within:ring-primary/20">
            {/* File Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={subiendoArchivo || !!archivoSeleccionado}
            >
              <Paperclip className="w-5 h-5" />
            </Button>

            {/* Text Input */}
            <div className="flex-1 min-w-0 py-2">
              {archivoSeleccionado ? (
                <div className="flex items-center gap-2 px-2 bg-primary/5 rounded-lg py-1">
                  <div className="p-1.5 bg-background rounded-md shadow-sm">
                    <Paperclip className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium truncate flex-1">{archivoSeleccionado.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                    onClick={cancelarArchivo}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <textarea
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  disabled={enviando}
                  className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm max-h-32 resize-none placeholder:text-muted-foreground/50 py-0.5 scrollbar-hide"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      // trigger submit manually since it's not a form anymore or wrap in form
                      // we'll just attach handler to button or handle here
                      if (nuevoMensaje.trim()) document.getElementById('send-btn')?.click();
                    }
                  }}
                />
              )}
            </div>

            {/* Send Button */}
            <Button
              id="send-btn"
              type="button" // changed to button to manual trigger
              onClick={archivoSeleccionado ? enviarArchivo : (e) => enviarMensaje(e as any)}
              size="icon"
              className={cn(
                "rounded-full h-10 w-10 shadow-sm transition-all duration-300 shrink-0",
                (nuevoMensaje.trim() || archivoSeleccionado)
                  ? "bg-primary hover:bg-primary/90 translate-x-0 opacity-100"
                  : "bg-muted text-muted-foreground hover:bg-muted translate-x-2 opacity-0 w-0 p-0 overflow-hidden"
              )}
              disabled={enviando || subiendoArchivo || (!nuevoMensaje.trim() && !archivoSeleccionado)}
            >
              {enviando || subiendoArchivo ? (
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5 ml-0.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
