import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReportSnapshot, ReportTotals } from '@/lib/data/client-reports'

// Relatório em folha clara (igual no celular, no PDF e no link do cliente)

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const num = (v: number) => new Intl.NumberFormat('pt-BR').format(Math.round(v || 0))
const pct = (v: number) => `${(v || 0).toFixed(2).replace('.', ',')}%`
const ratio = (v: number) => `${(v || 0).toFixed(2).replace('.', ',')}x`
const fmtDate = (v: string) => v.split('-').reverse().join('/')

type Metric = {
  key: keyof ReportTotals
  label: string
  format: (v: number) => string
  // true: subir é bom · false: subir é ruim · null: neutro
  upIsGood: boolean | null
}

function metricsFor(snapshot: ReportSnapshot): { main: Metric[]; extra: Metric[] } {
  const isSale = snapshot.campaign_type === 'Venda'
  const main: Metric[] = [
    { key: 'spend', label: 'Investimento', format: brl, upIsGood: null },
    { key: 'results', label: `Resultados (${snapshot.result_label})`, format: num, upIsGood: true },
    { key: 'cost_per_result', label: 'Custo por resultado', format: brl, upIsGood: false },
    ...(isSale
      ? [
          { key: 'conversion_value', label: 'Faturamento', format: brl, upIsGood: true } as Metric,
          { key: 'roas', label: 'ROAS', format: ratio, upIsGood: true } as Metric,
        ]
      : [{ key: 'reach', label: 'Alcance', format: num, upIsGood: true } as Metric]),
  ]
  const extra: Metric[] = [
    { key: 'impressions', label: 'Impressões', format: num, upIsGood: true },
    { key: 'clicks', label: 'Cliques', format: num, upIsGood: true },
    { key: 'ctr', label: 'CTR', format: pct, upIsGood: true },
    { key: 'cpc', label: 'CPC', format: brl, upIsGood: false },
    { key: 'cpm', label: 'CPM', format: brl, upIsGood: null },
  ]
  return { main, extra }
}

function Delta({ current, previous, upIsGood }: { current: number; previous: number; upIsGood: boolean | null }) {
  if (!previous || previous <= 0) {
    return <span className="text-xs text-neutral-400">{current > 0 ? 'novo' : '—'}</span>
  }
  const change = ((current - previous) / previous) * 100
  if (Math.abs(change) < 0.5) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-neutral-400">
        <Minus className="h-3 w-3" /> 0%
      </span>
    )
  }
  const up = change > 0
  const good = upIsGood === null ? null : up === upIsGood
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        good === null ? 'text-neutral-500' : good ? 'text-emerald-600' : 'text-red-600',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(change).toFixed(1).replace('.', ',')}%
    </span>
  )
}

export function ReportView({ title, snapshot }: { title: string; snapshot: ReportSnapshot }) {
  const { main, extra } = metricsFor(snapshot)
  const cur = snapshot.total.current
  const prev = snapshot.total.previous
  const hasData = cur.spend > 0 || cur.impressions > 0

  return (
    <article className="mx-auto w-full max-w-3xl bg-white p-5 text-neutral-900 sm:rounded-xl sm:p-10 sm:shadow-lg print:max-w-none print:p-0 print:shadow-none">
      <header className="border-b border-neutral-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Relatório de tráfego pago</p>
        <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">{snapshot.client_name}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {fmtDate(snapshot.period.start)} a {fmtDate(snapshot.period.end)}
          <span className="text-neutral-400">
            {' '}· comparado com {fmtDate(snapshot.previous_period.start)} a {fmtDate(snapshot.previous_period.end)}
          </span>
        </p>
        <p className="sr-only">{title}</p>
      </header>

      {!hasData ? (
        <p className="py-12 text-center text-sm text-neutral-500">
          Não há dados de anúncios neste período.
        </p>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Resumo do período</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {main.map((m, i) => (
                <div
                  key={m.key}
                  className={cn(
                    'rounded-lg border border-neutral-200 bg-neutral-50 p-3',
                    i === 0 && 'col-span-2 sm:col-span-1',
                  )}
                >
                  <p className="text-xs text-neutral-500">{m.label}</p>
                  <p className="mt-1 text-xl font-bold sm:text-2xl">{m.format(cur[m.key])}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Delta current={cur[m.key]} previous={prev[m.key]} upIsGood={m.upIsGood} />
                    <span className="text-[11px] text-neutral-400">vs. anterior</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Detalhes</h2>
            <ComparisonTable metrics={extra} current={cur} previous={prev} />
          </section>

          {snapshot.platforms.length > 1 &&
            snapshot.platforms.map((p) => (
              <section key={p.platform} className="mt-6 break-inside-avoid">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  {p.platform === 'google' ? 'Google Ads' : 'Meta Ads'}
                </h2>
                <ComparisonTable metrics={[...main, ...extra]} current={p.current} previous={p.previous} />
              </section>
            ))}
        </>
      )}

      <footer className="mt-8 border-t border-neutral-200 pt-3 text-[11px] text-neutral-400">
        Gerado em {new Date(snapshot.generated_at).toLocaleDateString('pt-BR')} · Impulsionaí Marketing
      </footer>
    </article>
  )
}

function ComparisonTable({
  metrics, current, previous,
}: { metrics: Metric[]; current: ReportTotals; previous: ReportTotals }) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-xs text-neutral-500">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Métrica</th>
            <th className="px-3 py-2 text-right font-medium">Período</th>
            <th className="px-3 py-2 text-right font-medium">Anterior</th>
            <th className="px-3 py-2 text-right font-medium">Variação</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => (
            <tr key={m.key} className="border-t border-neutral-100">
              <td className="px-3 py-2">{m.label}</td>
              <td className="px-3 py-2 text-right font-medium">{m.format(current[m.key])}</td>
              <td className="px-3 py-2 text-right text-neutral-500">{m.format(previous[m.key])}</td>
              <td className="px-3 py-2 text-right">
                <Delta current={current[m.key]} previous={previous[m.key]} upIsGood={m.upIsGood} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
