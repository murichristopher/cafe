'use client';

import { Progress } from "@/components/ui/progress";

const indicators = [
  {
    name: "Índice de Liquidez",
    value: 2.5,
    target: 2.0,
    description: "Capacidade de pagar dívidas de curto prazo"
  },
  {
    name: "Margem de Lucro",
    value: 25,
    target: 20,
    description: "Percentual de lucro sobre as vendas"
  },
  {
    name: "Endividamento",
    value: 35,
    target: 40,
    description: "Percentual de capital de terceiros"
  },
  {
    name: "Rotatividade de Estoque",
    value: 4.2,
    target: 4.0,
    description: "Vezes que o estoque é renovado por ano"
  }
];

export function FinancialHealth() {
  return (
    <div className="space-y-8">
      {indicators.map((indicator) => (
        <div key={indicator.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{indicator.name}</p>
              <p className="text-xs text-muted-foreground">{indicator.description}</p>
            </div>
            <div className="text-sm font-medium">
              {typeof indicator.value === 'number' && indicator.value % 1 === 0
                ? `${indicator.value}%`
                : indicator.value.toFixed(1)}
            </div>
          </div>
          <Progress
            value={(indicator.value / indicator.target) * 100}
            className="h-2"
          />
        </div>
      ))}
    </div>
  );
} 