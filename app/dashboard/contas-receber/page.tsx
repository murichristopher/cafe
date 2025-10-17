'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const incomeFormSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  notes: z.string().optional(),
});

const categories = [
  { value: "vendas", label: "Vendas de Produtos" },
  { value: "servicos", label: "Prestação de Serviços" },
  { value: "eventos", label: "Eventos" },
  { value: "outros", label: "Outros" },
];

const paymentMethods = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "transferencia", label: "Transferência Bancária" },
  { value: "boleto", label: "Boleto" },
];

// Dados de exemplo
const incomes = [
  {
    id: 1,
    description: "Venda de Produtos",
    amount: 2500.00,
    category: "vendas",
    paymentMethod: "pix",
    dueDate: "2024-03-25",
    status: "pendente",
  },
  {
    id: 2,
    description: "Prestação de Serviços",
    amount: 1800.00,
    category: "servicos",
    paymentMethod: "transferencia",
    dueDate: "2024-03-20",
    status: "recebido",
  },
  {
    id: 3,
    description: "Evento Corporativo",
    amount: 3500.00,
    category: "eventos",
    paymentMethod: "boleto",
    dueDate: "2024-03-15",
    status: "recebido",
  },
];

const categoryLabels = {
  vendas: "Vendas de Produtos",
  servicos: "Prestação de Serviços",
  eventos: "Eventos",
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

function IncomeForm() {
  const form = useForm<z.infer<typeof incomeFormSchema>>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      paymentMethod: "",
      dueDate: "",
      notes: "",
    },
  });

  function onSubmit(values: z.infer<typeof incomeFormSchema>) {
    // TODO: Implementar a lógica de salvamento
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Digite a descrição da receita" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forma de Pagamento</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Vencimento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Adicione observações sobre a receita"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Cadastrar Receita</Button>
      </form>
    </Form>
  );
}

export default function ContasReceberPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Contas a Receber</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Receita
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Nova Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeForm />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Receitas Cadastradas</CardTitle>
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
              {incomes.map((income) => (
                <TableRow key={income.id}>
                  <TableCell>{income.description}</TableCell>
                  <TableCell>{categoryLabels[income.category as keyof typeof categoryLabels]}</TableCell>
                  <TableCell>R$ {income.amount.toFixed(2)}</TableCell>
                  <TableCell>{paymentMethodLabels[income.paymentMethod as keyof typeof paymentMethodLabels]}</TableCell>
                  <TableCell>{new Date(income.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        income.status === "recebido"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {income.status === "recebido" ? "Recebido" : "Pendente"}
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