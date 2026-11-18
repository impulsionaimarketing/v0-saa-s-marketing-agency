// Modelos das folhas do cronograma mensal (HTML que o editor carrega)

export type DocumentTemplate = 'blank' | 'video' | 'arte'

export const DOCUMENT_TEMPLATES: {
  id: DocumentTemplate
  label: string
  description: string
  hasQuantity: boolean
}[] = [
  { id: 'blank', label: 'Em branco', description: 'Uma folha livre para escrever qualquer coisa.', hasQuantity: false },
  { id: 'video', label: 'Roteiro de vídeos', description: 'Vídeo 1, 2, 3… cada um com cenas: gancho, fala, tela e take.', hasQuantity: true },
  { id: 'arte', label: 'Criação de arte', description: 'Arte 1, 2, 3… com tema, formato, texto e referência.', hasQuantity: true },
]

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function field(label: string): string {
  return `<li><p><strong>${label}:</strong> </p></li>`
}

function videoBlock(n: number): string {
  return [
    `<h2>Vídeo ${n} — Nome do vídeo</h2>`,
    `<p><strong>Formato:</strong> Reels &nbsp;·&nbsp; <strong>Duração:</strong> </p>`,
    `<h3>Cena 1</h3>`,
    `<ul>${field('Gancho')}${field('O que vai ser dito')}${field('O que vai aparecer na tela')}${field('Take')}</ul>`,
    `<h3>Cena 2</h3>`,
    `<ul>${field('O que vai ser dito')}${field('O que vai aparecer na tela')}${field('Take')}</ul>`,
    `<h3>Fechamento</h3>`,
    `<ul>${field('Chamada para ação')}${field('Referência')}${field('Observações')}</ul>`,
  ].join('')
}

function arteBlock(n: number): string {
  return [
    `<h2>Arte ${n} — Tema da arte</h2>`,
    `<ul>${field('Formato (feed, story, carrossel)')}${field('Texto da arte')}${field('Referência')}${field('Observações')}</ul>`,
  ].join('')
}

export function buildTemplateHtml(
  template: DocumentTemplate,
  opts: { quantity?: number; clientName?: string; month?: number | null; year?: number | null } = {},
): string {
  const quantity = Math.max(1, Math.min(60, opts.quantity || 1))
  const period = opts.month && opts.year ? `${MONTH_NAMES[opts.month - 1]} de ${opts.year}` : ''
  const subtitle = [opts.clientName, period].filter(Boolean).map((t) => esc(String(t))).join(' · ')
  const header = (title: string) => `<h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}`

  if (template === 'video') {
    const blocks = Array.from({ length: quantity }, (_, i) => videoBlock(i + 1)).join('<hr>')
    return header('Roteiro de vídeos') + blocks
  }
  if (template === 'arte') {
    const blocks = Array.from({ length: quantity }, (_, i) => arteBlock(i + 1)).join('<hr>')
    return header('Criação de arte') + blocks
  }
  return header('Sem título') + '<p></p>'
}

export function defaultDocumentTitle(template: DocumentTemplate, month?: number | null, year?: number | null): string {
  const period = month && year ? ` — ${MONTH_NAMES[month - 1]}/${year}` : ''
  if (template === 'video') return `Roteiro de vídeos${period}`
  if (template === 'arte') return `Criação de arte${period}`
  return `Documento${period}`
}
