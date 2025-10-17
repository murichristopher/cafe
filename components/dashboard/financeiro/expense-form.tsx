'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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

const expenseFormSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  notes: z.string().optional(),
});

const categories = [
  { value: "funcionarios", label: "Pagamento de Funcionários" },
  { value: "passagem", label: "Gastos de Passagem" },
  { value: "uber", label: "Uber" },
  { value: "lalamove", label: "Lalamove" },
  { value: "combustivel", label: "Combustível" },
  { value: "mercado", label: "Mercado" },
  { value: "laticinios", label: "Laticínios" },
  { value: "distribuidora", label: "Distribuidora" },
  { value: "casa_festa", label: "Casa de Festa" },
  { value: "insumos", label: "Insumos" },
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

export function ExpenseForm() {
  const form = useForm<z.infer<typeof expenseFormSchema>>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      paymentMethod: "",
      dueDate: "",
      notes: "",
    },
  });

  function onSubmit(values: z.infer<typeof expenseFormSchema>) {
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
                <Input placeholder="Digite a descrição da despesa" {...field} />
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
                  placeholder="Adicione observações sobre a despesa"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Cadastrar Despesa</Button>
      </form>
    </Form>
  );
} 