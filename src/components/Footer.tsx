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

          <div className="flex gap-4">
            <a
              href="https://www.facebook.com/profile.php?id=61582808151376"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
            </a>
            <a
              href="https://www.tiktok.com/@bakan.pe?_r=1&_t=ZS-93SL2NCRad7"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
            </a>
          </div>

          <p className="text-sm text-muted">
            © {new Date().getFullYear()} Bakan. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
