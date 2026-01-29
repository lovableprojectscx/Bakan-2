import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, Shield, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const isAuthPage = location.pathname === "/auth";
  const showNavLinks = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isAuthPage) return null;

  const navLinks = [
    { name: "Inicio", href: "#inicio" },
    { name: "Nosotros", href: "#nosotros" },
    { name: "Cómo funciona", href: "#como-funciona" },
    { name: "Contacto", href: "#contacto" },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"}`}>
      <div className="container flex items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={logo} alt="Bakan Logo" className="h-10 w-auto transition-transform group-hover:scale-105" />
        </Link>

        {showNavLinks && (
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.name}
              </a>
            ))}
          </nav>
        )}

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                Mi Panel
              </Button>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="border-primary text-primary">
                  <Shield className="w-4 h-4 mr-2" /> Admin
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" /> Salir
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" className="text-sm font-medium hover:text-primary hover:bg-primary/5">
                  Iniciar sesión
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95">
                  Comenzar
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border/50 animate-slide-up p-4 shadow-lg">
          <div className="flex flex-col gap-4">
            {showNavLinks && navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-lg font-medium text-foreground/80 hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              {user ? (
                <>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}>
                    <User className="w-4 h-4 mr-2" />
                    Mi Perfil
                  </Button>
                  {isAdmin && (
                    <Button variant="outline" className="w-full justify-start border-primary text-primary" onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}>
                      <Shield className="w-4 h-4 mr-2" />
                      Panel Admin
                    </Button>
                  )}
                  <Button onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }} className="w-full">Mi Panel</Button>
                  <Button variant="destructive" className="w-full" onClick={() => { signOut(); setMobileMenuOpen(false); }}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <Button onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>Comenzar</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

