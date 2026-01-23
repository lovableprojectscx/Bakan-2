import { CheckCircle2, Clock, CreditCard, Shield, Truck, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionProgressProps {
  estadoActual: string;
}

interface Step {
  id: string;
  label: string;
  icon: any;
}

export const TransactionProgress = ({ estadoActual }: TransactionProgressProps) => {
  const steps: Step[] = [
    { id: 'iniciada', label: 'Iniciada', icon: Package },
    { id: 'pendiente_pago', label: 'Pago Pendiente', icon: Clock },
    { id: 'pago_en_verificacion', label: 'Verificando', icon: CreditCard },
    { id: 'pagada_retenida', label: 'Pago Retenido', icon: Shield },
    { id: 'enviado', label: 'Enviado', icon: Truck },
    { id: 'completada', label: 'Completada', icon: CheckCircle2 }
  ];

  const getCurrentStepIndex = () => {
    const index = steps.findIndex(step => step.id === estadoActual);
    return index !== -1 ? index : 0;
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="w-full px-2 py-4 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between relative">
        {/* Line connector */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" style={{ 
          marginLeft: '5%',
          marginRight: '5%'
        }}>
          <div 
            className="h-full bg-primary transition-all duration-500" 
            style={{ 
              width: `${(currentIndex / (steps.length - 1)) * 100}%`
            }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div 
              key={step.id}
              className="flex flex-col items-center relative z-10 flex-1"
            >
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  "ring-4 ring-background",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground animate-pulse",
                  isFuture && "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span 
                className={cn(
                  "text-[10px] sm:text-xs font-medium mt-2 text-center",
                  (isCompleted || isCurrent) && "text-foreground",
                  isFuture && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};