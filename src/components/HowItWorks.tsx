import { ShoppingCart, Shield, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: ShoppingCart,
    title: "Haces tu compra",
    description: "Encuentras lo que buscas en redes sociales y pagas a través de Bakan.",
  },
  {
    icon: Shield,
    title: "Guardamos tu dinero",
    description: "Retenemos el pago de forma segura mientras el vendedor envía tu producto.",
  },
  {
    icon: CheckCircle2,
    title: "Confirmas y listo",
    description: "Recibes tu producto, lo verificas y liberamos el pago al vendedor.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-12 sm:py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            Comprar es <span className="bg-gradient-primary bg-clip-text text-transparent">súper fácil</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            En solo 3 simples pasos, tus compras están protegidas
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:grid md:grid-cols-3 gap-8 relative">



            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="relative group hover-lift"
                >
                  {/* Step Card */}
                  <div className="glass-card rounded-[2rem] p-8 flex flex-col items-center text-center h-full border border-white/40 hover:border-primary/30 transition-all duration-300">

                    {/* Number Badge */}
                    <div className="absolute -top-4 bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                      Paso {index + 1}
                    </div>

                    {/* Icon Container */}
                    <div className="w-24 h-24 mb-6 rounded-3xl flex items-center justify-center relative overflown-visible group-hover:scale-110 transition-transform duration-500">
                      {/* Dynamic Gradient Shadow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />

                      {/* Icon */}
                      <Icon className="w-10 h-10 text-primary relative z-10" strokeWidth={1.5} />

                      {/* Decoration Ring */}
                      <div className="absolute inset-0 border-2 border-white/50 rounded-3xl opacity-50" />
                    </div>

                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-12 sm:mt-16 px-4">
          <div className="inline-block bg-success/10 border border-success/30 rounded-xl sm:rounded-2xl px-6 sm:px-8 py-3 sm:py-4">
            <p className="text-sm sm:text-base lg:text-lg font-medium text-success">
              ✓ Miles de transacciones seguras cada día
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
