import { ShieldCheck, Smartphone, Handshake } from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Pagos Seguros",
    description: "Tu dinero está protegido hasta que confirmes que recibiste tu producto en perfecto estado.",
    color: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400"
  },
  {
    icon: Handshake,
    title: "Confianza Total",
    description: "Vendedores verificados y compradores protegidos. Generamos un ambiente de confianza mutua.",
    color: "from-indigo-500 to-purple-500",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    text: "text-indigo-600 dark:text-indigo-400"
  },
  {
    icon: ShieldCheck,
    title: "Protección Garantizada",
    description: "Si algo sale mal, te devolvemos tu dinero. Tu tranquilidad es nuestra prioridad.",
    color: "from-emerald-500 to-green-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-600 dark:text-emerald-400"
  },
];

export const Features = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Decorative Circles */}
      {/* Decorative Circles - Reduced blur on mobile */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-[60px] md:blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-[60px] md:blur-[100px] pointer-events-none" />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-20 animate-fade-in">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            ¿Por qué elegir <span className="gradient-text">Bakan</span>?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-balance">
            La solución más segura para comprar y vender en redes sociales, diseñada para proteger tu dinero y tus ventas.
          </p>
        </div>

        {/* Mobile Compact List / Desktop Grid */}
        <div className="flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl md:rounded-[2rem] p-5 md:p-8 hover-lift flex flex-row md:flex-col items-start md:items-center text-left md:text-center group cursor-default transition-all duration-300 hover:border-primary/20 gap-4 md:gap-0"
            >
              <div className={`w-12 h-12 md:w-24 md:h-24 md:mb-6 rounded-2xl md:rounded-3xl flex-shrink-0 flex items-center justify-center relative overflown-visible group-hover:scale-110 transition-transform duration-500 ${feature.bg}`}>
                {/* Dynamic Gradient Shadow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-20 blur-xl group-hover:opacity-40 transition-opacity`} />

                {/* Icon */}
                <feature.icon className={`w-6 h-6 md:w-10 md:h-10 ${feature.text} relative z-10`} strokeWidth={1.5} />

                {/* Decoration Ring */}
                <div className={`absolute inset-0 border-2 border-white/50 rounded-2xl md:rounded-3xl opacity-50`} />
              </div>

              <div>
                <h3 className="text-lg md:text-2xl font-bold mb-1 md:mb-4 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-snug text-sm md:text-base">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

