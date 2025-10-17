'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseForm } from "@/components/dashboard/financeiro/expense-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

// Dados de exemplo
const expenses = [
  {
    id: 1,
    description: "Pagamento de Funcionários",
    amount: 5000.00,
    category: "funcionarios",
    paymentMethod: "pix",
    dueDate: "2024-03-25",
    status: "pendente",
  },
  {
    id: 2,
    description: "Compra de Insumos",
    amount: 1500.00,
    category: "insumos",
    paymentMethod: "boleto",
    dueDate: "2024-03-20",
    status: "pago",
  },
  {
    id: 3,
    description: "Transporte - Uber",
    amount: 45.50,
    category: "uber",
    paymentMethod: "cartao_credito",
    dueDate: "2024-03-15",
    status: "pago",
  },
];

const categoryLabels = {
  funcionarios: "Pagamento de Funcionários",
  passagem: "Gastos de Passagem",
  uber: "Uber",
  lalamove: "Lalamove",
  combustivel: "Combustível",
  mercado: "Mercado",
  laticinios: "Laticínios",
  distribuidora: "Distribuidora",
  casa_festa: "Casa de Festa",
  insumos: "Insumos",
  outros: "Outros",
};

const paymentMethodLabels = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  transferencia: "Transferência Bancária",
  boleto: "Boleto",
};

export default function ContasPagarPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Contas a Pagar</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Nova Despesa</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseForm />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Despesas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Forma de Pagamento</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>{categoryLabels[expense.category as keyof typeof categoryLabels]}</TableCell>
                  <TableCell>R$ {expense.amount.toFixed(2)}</TableCell>
                  <TableCell>{paymentMethodLabels[expense.paymentMethod as keyof typeof paymentMethodLabels]}</TableCell>
                  <TableCell>{new Date(expense.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        expense.status === "pago"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {expense.status === "pago" ? "Pago" : "Pendente"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 