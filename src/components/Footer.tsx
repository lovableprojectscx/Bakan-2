import { Shield } from "lucide-react";
import bakanIcon from "@/assets/bakan-icon-white.png";
import { TerminosDialog } from "./dialogs/TerminosDialog";
import { PrivacidadDialog } from "./dialogs/PrivacidadDialog";
import { SoporteDialog } from "./dialogs/SoporteDialog";
import { ContactoDialog } from "./dialogs/ContactoDialog";

export const Footer = () => {
  return (
    <footer id="contacto" className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img
              src={bakanIcon}
              alt="Bakan"
              className="h-10 w-auto object-contain"
            />
            <span className="text-2xl font-bold">Bakan</span>
          </div>

          <div className="flex gap-8 text-sm">
            <TerminosDialog />
            <PrivacidadDialog />
            <SoporteDialog />
            <ContactoDialog />
          </div>

          <p className="text-sm text-muted">
            © 2024 Bakan. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
