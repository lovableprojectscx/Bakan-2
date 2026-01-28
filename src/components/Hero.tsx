import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import bakanIcon from "@/assets/bakan-icon.png";


export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-surface pt-20">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[80px] -z-10 md:animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] -z-10" />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left Content */}
          <div className="flex flex-col gap-6 text-center lg:text-left items-center lg:items-start animate-slide-up mx-auto lg:mx-0 max-w-2xl lg:max-w-none">

            {/* Mobile-only Decorative Logo - Static for performance */}
            <div className="lg:hidden relative w-64 h-64 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
              <img
                src={bakanIcon}
                alt="Bakan Icon"
                className="relative z-10 w-full h-full object-contain drop-shadow-xl"
              />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Pago 100% Protegido</span>
            </div>

            <h1 className="text-3xl md:text-6xl font-extrabold tracking-tight leading-tight text-balance">
              Compra y vende <br />
              <span className="gradient-text">sin miedo</span>
            </h1>

            <p className="text-base text-muted-foreground md:text-xl max-w-[500px] leading-relaxed text-balance">
              Retenemos el pago de forma segura hasta que confirmes que recibiste tu producto.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-12 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1">
                  Comenzar ahora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#como-funciona" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full h-12 px-8 text-base border-2 hover:bg-secondary/50">
                  Ver cómo funciona
                </Button>
              </a>
            </div>

            <div className="flex items-center gap-6 mt-4 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                Sin comisiones ocultas
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                Soporte 24/7
              </div>
            </div>
          </div>


          {/* Right Visual - Desktop Only Composition */}
          <div className="hidden lg:flex justify-end animate-fade-in delay-200 mt-8 lg:mt-0">
            <div className="relative w-full max-w-[200px] sm:max-w-[400px] lg:max-w-[500px] aspect-square flex items-center justify-center">

              {/* Main Logo Container */}
              <div className="relative z-10 w-64 h-64 sm:w-96 sm:h-96 lg:w-[600px] lg:h-[600px] flex items-center justify-center animate-tilt-slow transform hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-[60px] animate-pulse-glow" />
                <img
                  src={bakanIcon}
                  alt="Bakan Icon"
                  className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                />
              </div>

              {/* Decorative Pulsing Rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse-glow" />

              {/* Floating Element 1 - Status */}
              <div className="absolute top-20 -left-10 glass-panel p-4 pr-6 rounded-2xl flex items-center gap-4 animate-float-medium shadow-strong border-l-4 border-success">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Dinero</p>
                  <p className="font-bold text-lg text-foreground">Resguardado</p>
                </div>
              </div>

              {/* Floating Element 2 - Transaction */}
              <div className="absolute top-0 right-0 sm:top-10 sm:-right-4 glass-panel p-4 pr-6 rounded-2xl flex items-center gap-4 animate-float-medium shadow-strong border-l-4 border-accent" style={{ animationDelay: '1.5s' }}>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Protección</p>
                  <p className="font-bold text-lg text-foreground">Garantizada</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
