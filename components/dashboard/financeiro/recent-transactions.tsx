'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const transactions = [
  {
    id: 1,
    description: "Pagamento de Fornecedor",
    amount: -1500.00,
    date: "2024-03-15",
    category: "Fornecedores",
    type: "despesa"
  },
  {
    id: 2,
    description: "Venda de Produtos",
    amount: 2500.00,
    date: "2024-03-14",
    category: "Vendas",
    type: "receita"
  },
  {
    id: 3,
    description: "Pagamento de Funcionários",
    amount: -5000.00,
    date: "2024-03-13",
    category: "Folha de Pagamento",
    type: "despesa"
  },
  {
    id: 4,
    description: "Compra de Insumos",
    amount: -800.00,
    date: "2024-03-12",
    category: "Insumos",
    type: "despesa"
  },
  {
    id: 5,
    description: "Venda de Serviços",
    amount: 1800.00,
    date: "2024-03-11",
    category: "Serviços",
    type: "receita"
  }
];

export function RecentTransactions() {
  return (
    <div className="space-y-8">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {transaction.type === "receita" ? "R" : "D"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {transaction.description}
            </p>
            <p className="text-sm text-muted-foreground">
              {transaction.category}
            </p>
          </div>
          <div className="ml-auto font-medium">
            <span className={transaction.type === "receita" ? "text-green-600" : "text-red-600"}>
              {transaction.type === "receita" ? "+" : "-"} R$ {Math.abs(transaction.amount).toFixed(2)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
} 