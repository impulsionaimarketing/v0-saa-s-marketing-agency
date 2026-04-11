'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Sparkles, X, Send, Mic, Bot, Maximize2, Minimize2, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

const quickSuggestions = [
  'Quais demandas estão pendentes?',
  'Criar nova demanda',
  'Ver clientes ativos',
  'Resumo do cronograma',
]

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
      recognition.interimResults = false
      recognitionRef.current = recognition

      recognition.onstart = () => setIsListening(true)
      
      recognition.onend = () => {
        // Only process if we were actively listening
        if (isListening) {
          setIsListening(false)
        }
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const lastResult = event.results[event.results.length - 1]
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript
          setInput(prev => prev + ' ' + transcript)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Erro no reconhecimento de voz:', event.error)
        stopListening()
      }

      recognition.start()
      setIsListening(true)
    } catch (error) {
      console.error('Erro ao acessar microfone:', error)
      alert('Não foi possível acessar o microfone.')
    }
  }, [updateAudioLevels, isListening])

  const stopListening = useCallback(() => {
    setIsListening(false)
    setIsProcessingAudio(true)

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

    // Simulate processing time then send message
    setTimeout(() => {
      setIsProcessingAudio(false)
      // Get the current input value and send if not empty
      setInput(currentInput => {
        if (currentInput.trim()) {
          sendMessage(currentInput.trim())
          return ''
        }
        return currentInput
      })
    }, 500)
  }, [])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = { role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(
        'https://n8n.impulsionaimarketing.com.br/webhook/agente-ia',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: messages.slice(-6).map(m => ({
              role: m.role,
              content: m.content
            }))
          })
        }
      )

      const data = await response.json()

      const aiMessage: Message = {
        role: 'assistant',
        content: data.response || data.output || data.text || 'Não consegui processar sua solicitação.',
        timestamp: new Date()
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
              : "bottom-24 right-6 w-[380px] h-[520px] rounded-2xl max-sm:inset-4 max-sm:w-auto max-sm:h-auto max-sm:bottom-20"
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
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
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
                      {message.content}
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
          </ScrollArea>

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
                  Gravando... solte para parar
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
                  onMouseDown={(e) => {
                    e.preventDefault()
                    startListening()
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault()
                    if (isListening) stopListening()
                  }}
                  onMouseLeave={() => {
                    if (isListening) stopListening()
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    startListening()
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault()
                    if (isListening) stopListening()
                  }}
                  disabled={isLoading || isProcessingAudio}
                  className={cn(
                    "shrink-0 rounded-full transition-all select-none",
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
