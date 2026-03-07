'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { leadsPerDay, investmentResults } from '@/lib/mock-data'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export function LeadsChart() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Leads / Mensagens por Dia</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Últimos 7 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={leadsPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--popover-foreground))'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="leads" 
                name="Leads"
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="messages" 
                name="Mensagens"
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function InvestmentChart() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Investimento por Cliente</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Últimos 30 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={investmentResults}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="client" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--popover-foreground))'
                }}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
              />
              <Legend />
              <Bar 
                dataKey="investment" 
                name="Investimento"
                fill="hsl(var(--chart-2))" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="results" 
                name="Resultados"
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
