import { useState } from "react";
import { Calculator, DollarSign, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const CommissionCalculator = () => {
  const [amount, setAmount] = useState<string>("");
  const commissionRate = 3; // 3% commission


  const calculateCommission = (value: number) => {
    // Si es menor a 100 soles, cobra 3 soles fijos.
    // Si es 100 soles o más, cobra el 3%.
    if (value < 100) {
      return 3.00;
    }
    return (value * commissionRate) / 100;
  };

  const numericAmount = parseFloat(amount) || 0;
  const commission = numericAmount > 0 ? calculateCommission(numericAmount) : 0;
  // Nuevo modelo: comprador paga precio + comisión, vendedor recibe el precio completo
  const totalToPay = numericAmount + commission; // Lo que paga el comprador
  const sellerReceives = numericAmount; // Lo que recibe el vendedor (precio completo)

  return (
    <section id="calculadora" className="py-16 sm:py-20 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Calculator className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Calcula tus comisiones</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Calculadora de{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Comisiones
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            El comprador paga el precio + comisión de seguridad ({commissionRate}% o mínimo S/ 3.00 para montos menores a 100).
            El vendedor recibe el precio completo. Transparencia total.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="p-6 sm:p-8 lg:p-10 shadow-soft border-2 animate-scale-in">
            <div className="space-y-8">
              <div>
                <Label htmlFor="amount" className="text-base sm:text-lg mb-3 flex items-center gap-2">
                  <span className="text-primary font-bold">S/</span>
                  Monto de la transacción
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Ingresa el monto"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-xl sm:text-2xl h-14 sm:h-16 border-2 focus:border-primary"
                  min="0"
                  step="0.01"
                />
              </div>

              {numericAmount > 0 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="h-px bg-gradient-primary opacity-20" />

                  <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-4 sm:p-6 border-2 border-primary/30">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <p className="text-sm font-medium text-muted-foreground">
                          El comprador paga
                        </p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-primary">
                        S/ {totalToPay.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        (Precio + comisión de seguridad)
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-4 sm:p-6 border-2 border-success/30">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-success" />
                        <p className="text-sm font-medium text-muted-foreground">
                          El vendedor recibe
                        </p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-success">
                        S/ {sellerReceives.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        (Precio completo del producto)
                      </p>
                    </div>
                  </div>

                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <Calculator className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Desglose de la transacción:</p>
                        <p>Precio del producto: <span className="font-semibold">S/ {numericAmount.toFixed(2)}</span></p>
                        <p>Comisión de seguridad: <span className="font-semibold">+S/ {commission.toFixed(2)}</span></p>
                        <p className="text-primary font-bold mt-1">Total comprador: S/ {totalToPay.toFixed(2)}</p>
                        <p className="text-success font-bold">Vendedor recibe: S/ {sellerReceives.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              * La comisión de seguridad garantiza protección para ambas partes en cada transacción
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};