import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { APP_CONFIG } from '@/config';

interface TransactionCodeShareProps {
  codigo: string;
  monto: number;
  titulo: string;
}

export const TransactionCodeShare = ({ codigo, monto, titulo }: TransactionCodeShareProps) => {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareableLink = `${APP_CONFIG.getShareUrl()}/auth?code=${codigo}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopied(true);
      toast.success('Código copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Error al copiar el código');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setLinkCopied(true);
      toast.success('Link copiado al portapapeles');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      toast.error('Error al copiar el link');
    }
  };

  const handleNativeShare = async () => {
    const shareData = {
      title: 'Únete a la transacción en Bakan',
      text: `Hola, únete a la transacción por "${titulo}" (S/ ${monto.toFixed(2)}). Usa el código: ${codigo}`,
      url: shareableLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Compartido correctamente');
      } catch (err) {
        // User cancelled, ignore
      }
    } else {
      // Fallback for desktop
      copyLink();
    }
  };

  return (
    <Card className="shadow-sm border-dashed">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="w-4 h-4 text-primary" />
          Código de Invitación
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Compact Layout: Code + Copy Button inline */}
        <div className="flex items-center gap-2 p-1.5 pl-3 bg-muted/50 rounded-lg border border-border/50">
          <span className="font-mono text-sm font-bold tracking-widest text-foreground flex-1 truncate">
            {codigo}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyCode}
            className="h-8 w-8 p-0 hover:bg-background shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
          </Button>
        </div>

        {/* Primary Action: Native Share */}
        <Button
          className="w-full gap-2 font-medium"
          variant="outline"
          onClick={handleNativeShare}
        >
          <Share2 className="w-4 h-4" />
          Compartir Link de Invitación
        </Button>
      </CardContent>
    </Card>
  );
};
