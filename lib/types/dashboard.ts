export interface MetricConfig {
  key: string
  label: string
  description: string
  format?: 'currency' | 'number' | 'percentage' | 'decimal'
}

export interface DashboardView {
  id: string
  companyId?: string
  userId?: string
  context: string
  name: string
  visibleMetrics: string[]
  isDefault: boolean
  createdAt?: string
  updatedAt?: string
}

export interface TrafficMetrics {
  client: string
  campaign: string
  dailyBudget: number
  impressions: number
  clicks: number
  messages: number
  cpl: number
  cpa: number
  roas: number
}
