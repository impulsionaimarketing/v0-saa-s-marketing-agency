'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Sparkles, X, Send, Mic, Bot, Maximize2, Minimize2, Loader2 } from 'lucide-react'

interface PendingAction {
  id: string
  tool: string
  args: Record<string, any>
  summary: string[]
  state?: 'pending' | 'running' | 'done' | 'cancelled' | 'error'
  result?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  pending?: PendingAction[]
}

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

const quickSuggestions = [
  'Quais demandas estão atrasadas?',
  'Quanto gastamos em anúncios este mês?',
  'O que está em Captação na Produção?',
  'Criar uma demanda',
]

// Formatação simples das respostas: **negrito**, `código`, títulos (#) e listas com "-" ou "*"
function FormattedText({ text }: { text: string }) {
  const cleaned = text
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
  const parts = cleaned.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return <code key={i} className="rounded bg-background/60 px-1 text-[0.85em]">{part.slice(1, -1)}</code>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

export function AgentChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isProcessingAudio, setIsProcessingAudio] = useState(false)
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0.1))
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const transcriptRef = useRef<string>('')
  const sendRef = useRef<((text: string) => void) | null>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const updateAudioLevels = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Sample 20 frequency bands
    const levels: number[] = []
    const step = Math.floor(dataArray.length / 20)
    for (let i = 0; i < 20; i++) {
      const value = dataArray[i * step] / 255
      levels.push(Math.max(0.1, value))
    }
    setAudioLevels(levels)

    animationFrameRef.current = requestAnimationFrame(updateAudioLevels)
  }, [])

  const startListening = useCallback(async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz.')
      return
    }

    try {
      // Reset transcript
      transcriptRef.current = ''

      // Get microphone access for visualization
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      // Setup audio context for visualization
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      // Start visualization
      updateAudioLevels()

      // Setup speech recognition
      const recognition = new SpeechRecognition()
      recognition.lang = 'pt-BR'
      recognition.continuous = true
      recognition.interimResults = true
      recognitionRef.current = recognition

      recognition.onstart = () => {
        console.log('[v0] Speech recognition started')
        setIsListening(true)
      }
      
      recognition.onend = () => {
        console.log('[v0] Speech recognition ended')
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log('[v0] Speech recognition result:', event.results)
        let fullTranscript = ''
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript
        }
        transcriptRef.current = fullTranscript
        console.log('[v0] Current transcript:', fullTranscript)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('[v0] Speech recognition error:', event.error)
        if (event.error !== 'aborted') {
          stopListening()
        }
      }

      recognition.start()
      setIsListening(true)
    } catch (error) {
      console.error('[v0] Error accessing microphone:', error)
      alert('Não foi possível acessar o microfone.')
    }
  }, [updateAudioLevels])

  const stopListening = useCallback(() => {
    setIsListening(false)
    setIsProcessingAudio(true)

    // Capture transcript before stopping
    const capturedTranscript = transcriptRef.current.trim()

    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    // Stop audio visualization
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // Reset audio levels
    setAudioLevels(Array(20).fill(0.1))

    // Small delay to show processing, then put text in input field
    setTimeout(() => {
      setIsProcessingAudio(false)
      if (capturedTranscript) {
        // Comando de voz: envia direto. Criar algo continua pedindo confirmação no cartão.
        if (sendRef.current) sendRef.current(capturedTranscript)
        else setInput(capturedTranscript)
      }
      transcriptRef.current = ''
    }, 300)
  }, [])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = { role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].slice(-8).map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await response.json()

      const aiMessage: Message = {
        role: 'assistant',
        content: data.reply || data.error || 'Não consegui processar sua solicitação.',
        timestamp: new Date(),
        pending: Array.isArray(data.pending) && data.pending.length
          ? data.pending.map((p: PendingAction) => ({ ...p, state: 'pending' as const }))
          : undefined,
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Erro ao contatar agente:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Erro ao conectar com o assistente. Tente novamente.',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  sendRef.current = sendMessage

  const updatePending = (messageIndex: number, actionId: string, patch: Partial<PendingAction>) => {
    setMessages(prev => prev.map((m, i) =>
      i === messageIndex && m.pending
        ? { ...m, pending: m.pending.map(p => (p.id === actionId ? { ...p, ...patch } : p)) }
        : m
    ))
  }

  const confirmAction = async (messageIndex: number, action: PendingAction) => {
    updatePending(messageIndex, action.id, { state: 'running' })
    try {
      const res = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: action.tool, args: action.args }),
      })
      const data = await res.json()
      if (data.success) updatePending(messageIndex, action.id, { state: 'done', result: data.message })
      else updatePending(messageIndex, action.id, { state: 'error', result: data.error || 'Não foi possível executar.' })
    } catch {
      updatePending(messageIndex, action.id, { state: 'error', result: 'Erro de conexão.' })
    }
  }

  // Confirma de uma vez todas as ações pendentes de uma mensagem
  const confirmAll = async (messageIndex: number) => {
    const actions = messages[messageIndex]?.pending?.filter(p => p.state === 'pending') ?? []
    for (const action of actions) {
      await confirmAction(messageIndex, action)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Toggle recording on click
  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div 
          className={cn(
            "fixed z-50 bg-card border border-border shadow-xl flex flex-col overflow-hidden",
            "animate-in slide-in-from-bottom-4 fade-in duration-300",
            isFullscreen 
              ? "inset-0 rounded-none" 
              : "bottom-24 right-6 w-[380px] h-[520px] max-h-[calc(100dvh-7rem)] rounded-2xl max-sm:inset-4 max-sm:w-auto max-sm:h-auto max-sm:max-h-none max-sm:bottom-20"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-full bg-primary/10">
                <Sparkles className="size-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">Assistente IA</span>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={toggleFullscreen}
                className="hover:bg-muted"
              >
                {isFullscreen ? (
                  <Minimize2 className="size-4" />
                ) : (
                  <Maximize2 className="size-4" />
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={() => {
                  setIsOpen(false)
                  setIsFullscreen(false)
                }}
                className="hover:bg-muted"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="flex items-center justify-center size-12 rounded-full bg-primary/10">
                  <Sparkles className="size-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Como posso ajudar?</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Escolha uma sugestão ou digite sua pergunta
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {quickSuggestions.map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80 transition-colors px-3 py-1.5"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-2",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center justify-center size-7 rounded-full bg-primary/10 shrink-0 mt-0.5">
                        <Bot className="size-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      )}
                    >
                      {message.role === 'assistant' ? <FormattedText text={message.content} /> : message.content}
                      {(message.pending?.filter(p => p.state === 'pending').length ?? 0) > 1 && (
                        <Button size="sm" className="mt-3 w-full" onClick={() => confirmAll(index)}>
                          Confirmar todas ({message.pending!.filter(p => p.state === 'pending').length})
                        </Button>
                      )}
                      {message.pending?.map(action => (
                        <div key={action.id} className="mt-3 rounded-xl border border-border bg-card p-3 text-foreground">
                          <ul className="space-y-0.5 text-xs">
                            {action.summary.map((line, i) => <li key={i}>{line}</li>)}
                          </ul>
                          {action.state === 'pending' || action.state === 'running' ? (
                            <div className="mt-3 flex gap-2">
                              <Button size="sm" className="flex-1" disabled={action.state === 'running'} onClick={() => confirmAction(index, action)}>
                                {action.state === 'running' ? <Loader2 className="size-4 animate-spin" /> : 'Confirmar'}
                              </Button>
                              <Button size="sm" variant="outline" disabled={action.state === 'running'} onClick={() => updatePending(index, action.id, { state: 'cancelled' })}>
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <p className={cn('mt-2 text-xs font-medium', action.state === 'done' ? 'text-success' : action.state === 'error' ? 'text-destructive' : 'text-muted-foreground')}>
                              {action.state === 'done' ? `✓ ${action.result}` : action.state === 'error' ? `Erro: ${action.result}` : 'Cancelado'}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="flex items-center justify-center size-7 rounded-full bg-primary/10 shrink-0 mt-0.5">
                      <Bot className="size-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                      <div className="flex gap-1">
                        <span className="size-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                        <span className="size-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                        <span className="size-2 rounded-full bg-muted-foreground animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-border bg-card">
            {/* Audio Waveform Visualization */}
            {isListening && (
              <div className="mb-3 p-3 bg-destructive/10 rounded-xl">
                <div className="flex items-center justify-center gap-0.5 h-12">
                  {audioLevels.map((level, index) => (
                    <div
                      key={index}
                      className="w-1 bg-destructive rounded-full transition-all duration-75"
                      style={{
                        height: `${Math.max(8, level * 48)}px`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-center text-destructive mt-2 font-medium">
                  Gravando... toque no microfone para parar
                </p>
              </div>
            )}

            {/* Processing Audio Indicator */}
            {isProcessingAudio && (
              <div className="mb-3 p-3 bg-muted rounded-xl flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Processando audio...</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  disabled={isLoading || isListening || isProcessingAudio}
                  className="flex-1 h-10 px-4 rounded-full bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleMicClick}
                  disabled={isLoading || isProcessingAudio}
                  className={cn(
                    "shrink-0 rounded-full transition-all",
                    isListening && "bg-destructive text-white hover:bg-destructive/90 scale-110",
                    isProcessingAudio && "opacity-50"
                  )}
                >
                  {isProcessingAudio ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Mic className="size-4" />
                  )}
                </Button>
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim() || isListening || isProcessingAudio}
                  className="shrink-0 rounded-full"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon-lg"
        className={cn(
          "fixed bottom-6 right-6 z-50 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105",
          isOpen && "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
      >
        {isOpen ? <X className="size-5" /> : <Sparkles className="size-5" />}
      </Button>
    </>
  )
}
