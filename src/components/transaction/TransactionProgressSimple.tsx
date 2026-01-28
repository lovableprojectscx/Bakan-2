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
      {/* Responsive Horizontal Stepper */}
      <div className="w-full">
        <div className="relative flex items-center justify-between px-2 sm:px-0">
          {/* Progress line */}
          <div className="absolute top-4 sm:top-5 left-0 right-0 h-0.5 sm:h-1 bg-muted mx-6 sm:mx-8 rounded-full overflow-hidden -z-10 bg-slate-200 dark:bg-slate-800">
            <div
              className={cn(
                "h-full transition-all duration-700 ease-out relative",
                isCompleted
                  ? "bg-gradient-to-r from-success to-success"
                  : "bg-gradient-to-r from-primary to-primary"
              )}
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            >
              {/* Pulsing glow effect on the progress line */}
              {!isCompleted && currentStep > 0 && (
                <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-r from-transparent to-white/40 animate-pulse" />
              )}
            </div>
          </div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            const isStepCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isFuture = index > currentStep;
            const isLastStepAndCompleted = index === 3 && isCompleted;

            return (
              <div key={step.id} className="relative flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ring-4 ring-background",
                    isStepCompleted && "bg-success text-success-foreground",
                    isLastStepAndCompleted && "bg-success text-success-foreground shadow-lg shadow-success/30",
                    isCurrent && !isLastStepAndCompleted && "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
                    isFuture && "bg-muted text-muted-foreground"
                  )}
                >
                  {isStepCompleted || isLastStepAndCompleted ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", isCurrent && "animate-pulse")} />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={cn(
                    "font-semibold text-[10px] sm:text-xs transition-colors leading-tight",
                    (isStepCompleted || isCurrent) && "text-foreground",
                    isLastStepAndCompleted && "text-success",
                    isFuture && "text-muted-foreground"
                  )}>
                    {step.label}
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
