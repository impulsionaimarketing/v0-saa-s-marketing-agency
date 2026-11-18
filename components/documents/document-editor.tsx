'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3, List, ListOrdered,
  ListChecks, Quote, Minus, Undo2, Redo2, FileDown, ArrowLeft, Check, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { updateClientDocument, type ClientDocument } from '@/lib/data/client-documents'

interface DocumentEditorProps {
  document: ClientDocument
  onBack: () => void
}

const PRINT_STYLES = `
  @page { margin: 18mm; }
  body { font-family: Inter, Arial, sans-serif; color: #111; line-height: 1.55; font-size: 12pt; }
  h1 { font-size: 22pt; margin: 0 0 4pt; }
  h2 { font-size: 16pt; margin: 18pt 0 6pt; border-bottom: 1px solid #ddd; padding-bottom: 3pt; }
  h3 { font-size: 13pt; margin: 12pt 0 4pt; }
  p { margin: 0 0 6pt; }
  ul, ol { margin: 0 0 8pt; padding-left: 18pt; }
  li { margin-bottom: 3pt; }
  ul[data-type="taskList"] { list-style: none; padding-left: 0; }
  ul[data-type="taskList"] li { display: flex; gap: 6pt; }
  hr { border: none; border-top: 1px solid #ccc; margin: 16pt 0; }
  blockquote { border-left: 3px solid #ccc; margin: 8pt 0; padding-left: 10pt; color: #444; }
  h2 { break-after: avoid; }
  h3 { break-after: avoid; }
  li, blockquote { break-inside: avoid; }
`

// Exporta como PDF: abre o diálogo de impressão do navegador ("Salvar como PDF")
function exportPdf(title: string, html: string) {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  document.body.appendChild(iframe)
  const doc = iframe.contentWindow?.document
  if (!doc || !iframe.contentWindow) return
  doc.open()
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title.replace(/</g, '&lt;')}</title><style>${PRINT_STYLES}</style></head><body>${html}</body></html>`)
  doc.close()
  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => iframe.remove(), 1500)
  }, 250)
}

function ToolButton({
  active, onClick, label, children, disabled,
}: { active?: boolean; onClick: () => void; label: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40',
        active && 'bg-primary/15 text-primary',
      )}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const Sep = () => <span className="mx-1 h-5 w-px shrink-0 bg-border" />
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto border-b border-border bg-card px-2 py-1.5">
      <ToolButton label="Desfazer" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo2 className="h-4 w-4" /></ToolButton>
      <ToolButton label="Refazer" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo2 className="h-4 w-4" /></ToolButton>
      <Sep />
      <ToolButton label="Título 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></ToolButton>
      <ToolButton label="Título 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></ToolButton>
      <ToolButton label="Título 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></ToolButton>
      <Sep />
      <ToolButton label="Negrito" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></ToolButton>
      <ToolButton label="Itálico" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></ToolButton>
      <ToolButton label="Sublinhado" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></ToolButton>
      <Sep />
      <ToolButton label="Lista" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></ToolButton>
      <ToolButton label="Lista numerada" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></ToolButton>
      <ToolButton label="Checklist" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListChecks className="h-4 w-4" /></ToolButton>
      <ToolButton label="Citação" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></ToolButton>
      <ToolButton label="Linha divisória" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></ToolButton>
    </div>
  )
}

export function DocumentEditor({ document: doc, onBack }: DocumentEditorProps) {
  const [title, setTitle] = useState(doc.title)
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<{ title?: string; content?: string }>({})

  const flush = async () => {
    const data = pending.current
    pending.current = {}
    if (data.title === undefined && data.content === undefined) return
    try {
      await updateClientDocument(doc.id, data)
      setSaveState('saved')
    } catch (error) {
      console.error('[v0] Error saving document:', error)
      pending.current = { ...data, ...pending.current }
      setSaveState('error')
    }
  }

  const schedule = (data: { title?: string; content?: string }) => {
    pending.current = { ...pending.current, ...data }
    setSaveState('saving')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(flush, 900)
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Escreva aqui…' }),
    ],
    content: doc.content,
    editorProps: { attributes: { class: 'doc-sheet-content focus:outline-none' } },
    onUpdate: ({ editor }) => schedule({ content: editor.getHTML() }),
  })

  // Salva o que estiver pendente ao sair da folha
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
      void flush()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tela cheia (como o Docs): trava a rolagem da página por trás
  useEffect(() => {
    const prev = window.document.body.style.overflow
    window.document.body.style.overflow = 'hidden'
    return () => { window.document.body.style.overflow = prev }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="flex items-center gap-1 border-b border-border bg-card px-2 py-2 sm:px-4">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={async () => { if (timer.current) clearTimeout(timer.current); await flush(); onBack() }} aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); schedule({ title: e.target.value }) }}
            className="w-full bg-transparent text-base font-semibold outline-none sm:text-lg"
            aria-label="Título do documento"
          />
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            {saveState === 'saving' && <><Loader2 className="h-3 w-3 animate-spin" /> Salvando…</>}
            {saveState === 'saved' && <><Check className="h-3 w-3" /> Salvo</>}
            {saveState === 'error' && <span className="text-destructive">Erro ao salvar — tentando de novo ao editar</span>}
          </p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0 gap-2" onClick={() => editor && exportPdf(title, editor.getHTML())}>
          <FileDown className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar PDF</span>
        </Button>
      </div>

      {editor && <Toolbar editor={editor} />}

      <div className="flex-1 overflow-y-auto bg-neutral-200/10 sm:p-6">
        <div className="doc-sheet mx-auto min-h-full max-w-3xl bg-white p-4 pb-24 text-neutral-900 sm:min-h-[80vh] sm:rounded-md sm:p-10 sm:shadow-lg">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>,
    window.document.body,
  )
}
