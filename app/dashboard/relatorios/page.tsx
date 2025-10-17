'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "@/components/dashboard/financeiro/overview";
import { ExpenseCategories } from "@/components/dashboard/financeiro/expense-categories";
import { FinancialHealth } from "@/components/dashboard/financeiro/financial-health";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RelatoriosPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h2>
        <div className="flex items-center space-x-2">
          <Select defaultValue="mes">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Última Semana</SelectItem>
              <SelectItem value="mes">Último Mês</SelectItem>
              <SelectItem value="trimestre">Último Trimestre</SelectItem>
              <SelectItem value="ano">Último Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="dre" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
        </TabsList>

        <TabsContent value="dre" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demonstração do Resultado do Exercício (DRE)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Receitas</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Vendas de Produtos</span>
                        <span className="text-green-600">R$ 25.000,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prestação de Serviços</span>
                        <span className="text-green-600">R$ 15.000,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Eventos</span>
                        <span className="text-green-600">R$ 10.000,00</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                          <span>Total de Receitas</span>
                          <span className="text-green-600">R$ 50.000,00</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Despesas</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Folha de Pagamento</span>
                        <span className="text-red-600">R$ 15.000,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Insumos</span>
                        <span className="text-red-600">R$ 10.000,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transporte</span>
                        <span className="text-red-600">R$ 5.000,00</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                          <span>Total de Despesas</span>
                          <span className="text-red-600">R$ 30.000,00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Resultado Líquido</span>
                    <span className="text-green-600">R$ 20.000,00</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fluxo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
            </CardHeader>
            <CardContent>
              <Overview />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseCategories />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indicadores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Indicadores Financeiros</CardTitle>
            </CardHeader>
            <CardContent>
              <FinancialHealth />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 