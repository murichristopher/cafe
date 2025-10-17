'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "@/components/dashboard/financeiro/overview";
import { RecentTransactions } from "@/components/dashboard/financeiro/recent-transactions";
import { FinancialHealth } from "@/components/dashboard/financeiro/financial-health";
import { ExpenseCategories } from "@/components/dashboard/financeiro/expense-categories";

export default function FinanceiroPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="health">Saúde Financeira</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receitas do Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 45.231,89</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Despesas do Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 23.456,78</div>
                <p className="text-xs text-muted-foreground">
                  +5.2% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Saldo Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 21.775,11</div>
                <p className="text-xs text-muted-foreground">
                  +14.9% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Contas a Pagar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 12.345,67</div>
                <p className="text-xs text-muted-foreground">
                  5 contas pendentes
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Visão Geral</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Transações Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentTransactions />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactions />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saúde Financeira</CardTitle>
            </CardHeader>
            <CardContent>
              <FinancialHealth />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorias de Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseCategories />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 