import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ContactoDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="hover:text-primary transition-colors">Contacto</button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Contáctanos</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <p className="text-muted-foreground">
            ¿Tienes alguna pregunta, sugerencia o necesitas ayuda? Estamos aquí para ayudarte.
          </p>

          <div className="bg-muted/50 p-6 rounded-lg space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Email de Soporte</p>
                <a 
                  href="mailto:bakanoficial@gmail.com" 
                  className="text-primary hover:underline"
                >
                  bakanoficial@gmail.com
                </a>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Respondemos todas las consultas en un plazo de 24-48 horas hábiles.
              </p>
              <Button 
                onClick={() => window.location.href = 'mailto:bakanoficial@gmail.com'}
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                Enviar Email
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Antes de contactarnos, verifica:</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>¿Tu pregunta está en nuestra sección de Preguntas Frecuentes (FAQ)?</li>
              <li>¿Has revisado los Términos y Condiciones relacionados a tu consulta?</li>
              <li>Si reportas un problema técnico, incluye capturas de pantalla o detalles del error</li>
              <li>Para disputas de transacciones, usa el sistema de disputas en tu panel de usuario</li>
            </ul>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Horario de Atención</p>
            <p className="text-sm text-muted-foreground">
              Lunes a Viernes: 9:00 AM - 6:00 PM (Hora de Perú)
              <br />
              Sábados: 9:00 AM - 1:00 PM
              <br />
              Domingos y feriados: Cerrado
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              * Los emails recibidos fuera del horario de atención serán respondidos el siguiente día hábil.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
