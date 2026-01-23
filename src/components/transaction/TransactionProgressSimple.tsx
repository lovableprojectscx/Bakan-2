import { cn } from '@/lib/utils';
import { UserPlus, Wallet, Truck, PartyPopper, Check } from 'lucide-react';

interface TransactionProgressSimpleProps {
  estadoActual: string;
}

const ESTADO_TO_STEP: Record<string, number> = {
  'iniciada': 0,
  'pendiente_pago': 1,
  'pago_en_verificacion': 1,
  'pagada_retenida': 2,
  'enviado': 2,
  'completada': 3,
  'en_disputa': -1,
  'cancelada': -1,
  'cancelada_automatico': -1,
};

export const TransactionProgressSimple = ({ estadoActual }: TransactionProgressSimpleProps) => {
  const currentStep = ESTADO_TO_STEP[estadoActual] ?? 0;
  const isCompleted = estadoActual === 'completada';

  const steps = [
    { 
      id: 0, 
      label: 'Conectar', 
      sublabel: 'Ambas partes',
      icon: UserPlus,
      states: ['iniciada']
    },
    { 
      id: 1, 
      label: 'Pagar', 
      sublabel: 'Yape o Plin',
      icon: Wallet,
      states: ['pendiente_pago', 'pago_en_verificacion']
    },
    { 
      id: 2, 
      label: 'Enviar', 
      sublabel: 'Producto físico',
      icon: Truck,
      states: ['pagada_retenida', 'enviado']
    },
    { 
      id: 3, 
      label: '¡Listo!', 
      sublabel: 'Completado',
      icon: isCompleted ? Check : PartyPopper,
      states: ['completada']
    },
  ];

  if (currentStep === -1) {
    return (
      <div className="w-full p-4 bg-destructive/10 rounded-xl border border-destructive/20">
        <p className="text-center text-destructive font-medium">
          ⚠️ Transacción {estadoActual === 'en_disputa' ? 'en disputa' : 'cancelada'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile: Vertical stepper */}
      <div className="md:hidden space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isStepCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isFuture = index > currentStep;
          const isLastStepAndCompleted = index === 3 && isCompleted;

          return (
            <div 
              key={step.id}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl transition-all duration-300",
                isLastStepAndCompleted && "bg-success/10 border-2 border-success shadow-md",
                isCurrent && !isLastStepAndCompleted && "bg-primary/10 border-2 border-primary shadow-md",
                isStepCompleted && "bg-success/10 border border-success/30",
                isFuture && "bg-muted/50 border border-transparent opacity-50"
              )}
            >
              <div 
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                  isStepCompleted && "bg-success text-success-foreground",
                  isLastStepAndCompleted && "bg-success text-success-foreground",
                  isCurrent && !isLastStepAndCompleted && "bg-primary text-primary-foreground animate-pulse",
                  isFuture && "bg-muted text-muted-foreground"
                )}
              >
                {isStepCompleted || isLastStepAndCompleted ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-semibold text-sm",
                  (isStepCompleted || isCurrent) && "text-foreground",
                  isFuture && "text-muted-foreground"
                )}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {step.sublabel}
                </p>
              </div>
              {(isStepCompleted || isLastStepAndCompleted) && (
                <span className="text-success text-lg">✓</span>
              )}
              {isCurrent && !isLastStepAndCompleted && (
                <span className="text-primary animate-bounce">👈</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: Horizontal stepper */}
      <div className="hidden md:block">
        <div className="relative flex items-center justify-between">
          {/* Progress line */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-muted mx-8 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-700 ease-out",
                isCompleted 
                  ? "bg-gradient-to-r from-success to-success" 
                  : "bg-gradient-to-r from-success to-primary"
              )}
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            const isStepCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isFuture = index > currentStep;
            const isLastStepAndCompleted = index === 3 && isCompleted;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center flex-1">
                <div 
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ring-4 ring-background",
                    isStepCompleted && "bg-success text-success-foreground scale-100",
                    isLastStepAndCompleted && "bg-success text-success-foreground scale-110 shadow-lg shadow-success/30",
                    isCurrent && !isLastStepAndCompleted && "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30",
                    isFuture && "bg-muted text-muted-foreground scale-90"
                  )}
                >
                  {isStepCompleted || isLastStepAndCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className={cn("w-5 h-5", isCurrent && "animate-pulse")} />
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className={cn(
                    "font-semibold text-sm transition-colors",
                    (isStepCompleted || isCurrent) && "text-foreground",
                    isLastStepAndCompleted && "text-success",
                    isFuture && "text-muted-foreground"
                  )}>
                    {step.label}
                  </p>
                  <p className={cn(
                    "text-xs mt-0.5",
                    isLastStepAndCompleted ? "text-success font-medium" : (isCurrent ? "text-primary font-medium" : "text-muted-foreground")
                  )}>
                    {step.sublabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
