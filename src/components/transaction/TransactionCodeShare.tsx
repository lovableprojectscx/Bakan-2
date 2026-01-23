import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionCodeShareProps {
  codigo: string;
}

export const TransactionCodeShare = ({ codigo }: TransactionCodeShareProps) => {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareableLink = `${window.location.origin}/auth?code=${codigo}`;

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

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Compartir Transacción
        </CardTitle>
        <CardDescription>
          Comparte este código o link con la otra parte para que se una a la transacción
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Código de Invitación</Label>
          <div className="flex gap-2">
            <Input 
              value={codigo} 
              readOnly 
              className="font-mono text-lg font-semibold"
            />
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={copyCode}
              className="shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Link para Compartir</Label>
          <div className="flex gap-2">
            <Input 
              value={shareableLink} 
              readOnly 
              className="text-sm"
            />
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={copyLink}
              className="shrink-0"
            >
              {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Este link llevará al usuario a autenticarse (si no lo está) y luego unirse automáticamente a la transacción
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
