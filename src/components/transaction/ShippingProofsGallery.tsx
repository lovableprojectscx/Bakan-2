import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  Package, 
  Image as ImageIcon, 
  FileVideo, 
  File, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  X,
  Download,
  Truck,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PruebaEnvio {
  id: string;
  url_archivo: string;
  tipo_prueba: string;
  descripcion: string | null;
  fecha_carga: string;
}

interface ShippingProofsGalleryProps {
  transaccionId: string;
  titulo?: string;
}

export const ShippingProofsGallery = ({ transaccionId, titulo = "Pruebas de Envío" }: ShippingProofsGalleryProps) => {
  const [pruebas, setPruebas] = useState<PruebaEnvio[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchPruebas();
  }, [transaccionId]);

  const fetchPruebas = async () => {
    try {
      const { data, error } = await supabase
        .from('pruebas_transaccion')
        .select('id, url_archivo, tipo_prueba, descripcion, fecha_carga')
        .eq('transaccion_id', transaccionId)
        .in('tipo_prueba', ['prueba_envio', 'video_empaquetado'])
        .order('fecha_carga', { ascending: false });

      if (error) throw error;
      setPruebas(data || []);
    } catch (error) {
      console.error('Error fetching shipping proofs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (url: string): 'image' | 'video' | 'document' => {
    const lower = url.toLowerCase();
    if (lower.match(/\.(jpg|jpeg|png|gif|webp|heic)(\?|$)/i)) return 'image';
    if (lower.match(/\.(mp4|mov|webm|avi|mkv)(\?|$)/i)) return 'video';
    return 'document';
  };

  const getIcon = (tipo: 'image' | 'video' | 'document') => {
    switch (tipo) {
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'video': return <FileVideo className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const getBadgeLabel = (tipoPrueba: string) => {
    return tipoPrueba === 'video_empaquetado' ? 'Video' : 'Foto';
  };

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < pruebas.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  if (loading) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Cargando pruebas...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pruebas.length === 0) {
    return null; // Don't show anything if no proofs
  }

  const selectedPrueba = selectedIndex !== null ? pruebas[selectedIndex] : null;
  const selectedFileType = selectedPrueba ? getFileType(selectedPrueba.url_archivo) : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" />
          {titulo}
          <Badge variant="secondary" className="ml-auto">
            {pruebas.length} archivo{pruebas.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Thumbnail Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {pruebas.map((prueba, index) => {
            const fileType = getFileType(prueba.url_archivo);
            return (
              <Dialog key={prueba.id}>
                <DialogTrigger asChild>
                  <button
                    onClick={() => setSelectedIndex(index)}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all group focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {fileType === 'image' ? (
                      <img
                        src={prueba.url_archivo}
                        alt={prueba.descripcion || 'Prueba de envío'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    ) : fileType === 'video' ? (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <FileVideo className="w-8 h-8 text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <File className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Type badge */}
                    <div className="absolute top-1 right-1">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                        {getBadgeLabel(prueba.tipo_prueba)}
                      </Badge>
                    </div>
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </div>
                  </button>
                </DialogTrigger>
                
                {/* Lightbox Modal */}
                <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
                  <div className="relative flex flex-col h-[90vh]">
                    {/* Close button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 z-50 text-white hover:bg-white/20"
                      onClick={() => setSelectedIndex(null)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                    
                    {/* Navigation arrows */}
                    {pruebas.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 disabled:opacity-30"
                          onClick={handlePrev}
                          disabled={selectedIndex === 0}
                        >
                          <ChevronLeft className="w-8 h-8" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 disabled:opacity-30"
                          onClick={handleNext}
                          disabled={selectedIndex === pruebas.length - 1}
                        >
                          <ChevronRight className="w-8 h-8" />
                        </Button>
                      </>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                      {selectedPrueba && selectedFileType === 'image' && (
                        <img
                          src={selectedPrueba.url_archivo}
                          alt={selectedPrueba.descripcion || 'Prueba de envío'}
                          className="max-w-full max-h-full object-contain"
                        />
                      )}
                      {selectedPrueba && selectedFileType === 'video' && (
                        <video
                          src={selectedPrueba.url_archivo}
                          controls
                          autoPlay
                          className="max-w-full max-h-full"
                        />
                      )}
                      {selectedPrueba && selectedFileType === 'document' && (
                        <div className="text-center text-white">
                          <File className="w-16 h-16 mx-auto mb-4" />
                          <p className="mb-4">Documento adjunto</p>
                          <Button
                            variant="outline"
                            onClick={() => window.open(selectedPrueba.url_archivo, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Descargar
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Footer info */}
                    {selectedPrueba && (
                      <div className="p-4 bg-black/80 text-white">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {getIcon(selectedFileType!)}
                            <div>
                              <p className="text-sm font-medium">
                                {selectedPrueba.descripcion || 'Prueba de envío'}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-white/60">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(selectedPrueba.fecha_carga), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white/60">
                              {(selectedIndex ?? 0) + 1} / {pruebas.length}
                            </span>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => window.open(selectedPrueba.url_archivo, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Abrir
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
