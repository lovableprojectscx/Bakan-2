import { Target, Users, Award, TrendingUp, ShieldCheck, Eye, Zap } from "lucide-react";

const stats = [
  { icon: Users, value: "10K+", label: "Usuarios activos" },
  { icon: Award, value: "99.9%", label: "Transacciones exitosas" },
  { icon: TrendingUp, value: "S/ 6M+", label: "Protegidos en transacciones" },
];

export const About = () => {
  return (
    <section id="nosotros" className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-6">
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">Sobre nosotros</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              Nuestra <span className="bg-gradient-primary bg-clip-text text-transparent">misión</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
              En Bakan, creemos que comprar y vender online debe ser tan seguro como en persona.
              Protegemos cada transacción para que <span className="font-semibold text-foreground">no te vendan gato por liebre</span> y puedas confiar en cada compra.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 mb-12 sm:mb-20">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`glass-card rounded-2xl md:rounded-[2rem] p-4 md:p-8 hover-lift flex flex-col items-center text-center group cursor-default transition-all duration-300 hover:border-primary/20 ${index === 2 ? 'col-span-2 md:col-span-1' : ''}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-12 h-12 md:w-20 md:h-20 mb-3 md:mb-6 rounded-2xl md:rounded-3xl flex items-center justify-center relative overflown-visible group-hover:scale-110 transition-transform duration-500`}>
                    {/* Dynamic Gradient Shadow */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-20 blur-xl group-hover:opacity-40 transition-opacity`} />

                    {/* Icon */}
                    <Icon className="w-6 h-6 md:w-10 md:h-10 text-primary relative z-10" strokeWidth={1.5} />

                    {/* Decoration Ring */}
                    <div className="absolute inset-0 border-2 border-white/50 rounded-2xl md:rounded-3xl opacity-50" />
                  </div>

                  <div className="text-xl md:text-3xl lg:text-5xl font-extrabold mb-1 md:mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-[10px] md:text-base text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Story */}
          <div className="bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-border/50 shadow-soft">
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-2xl sm:text-3xl font-bold">¿Por qué existe Bakan?</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Vimos cómo miles de personas perdían dinero por estafas en redes sociales.
                  Compradores que pagaban y nunca recibían sus productos, vendedores que enviaban
                  y nunca les pagaban.
                </p>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Decidimos crear una solución simple: guardamos el dinero del comprador hasta
                  que confirme que recibió su producto. Así, ambas partes están protegidas y
                  pueden hacer negocios con total confianza.
                </p>
              </div>
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 mt-6 lg:mt-0 max-w-lg mx-auto w-full">
                <div className="space-y-8">
                  <div className="flex items-center gap-4 group">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <ShieldCheck className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">Seguridad primero</h4>
                      <p className="text-sm text-muted-foreground leading-snug">
                        Tu dinero está protegido en cada paso de la transacción
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 group">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Eye className="w-7 h-7 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1 group-hover:text-blue-500 transition-colors">Transparencia total</h4>
                      <p className="text-sm text-muted-foreground leading-snug">
                        Siempre sabes dónde está tu dinero y en qué estado está tu compra
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 group">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Zap className="w-7 h-7 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1 group-hover:text-amber-500 transition-colors">Rápido y fácil</h4>
                      <p className="text-sm text-muted-foreground leading-snug">
                        Proceso simple en 3 pasos, sin complicaciones ni papeleos
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
