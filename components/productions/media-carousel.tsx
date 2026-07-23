'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CarouselMedia = {
  url: string
  file_type?: string | null
}

function isVideoType(media: CarouselMedia): boolean {
  if (media.file_type) {
    return media.file_type.startsWith('video/') || media.file_type === 'video'
  }
  return /\.(mp4|mov|webm|m4v)$/i.test(media.url)
}

interface MediaCarouselProps {
  items: CarouselMedia[]
  alt: string
  /** Tailwind aspect ratio class applied to the viewport. */
  aspectClassName?: string
  className?: string
  /** object-fit for the media. Defaults to contain. */
  fit?: 'contain' | 'cover'
  /** Notifica o slide ativo (índice) sempre que muda. */
  onActiveIndexChange?: (index: number) => void
  /** Overlay renderizado sobre o slide correspondente (ex.: status de decisão). */
  renderSlideOverlay?: (index: number) => React.ReactNode
}

export function MediaCarousel({
  items,
  alt,
  aspectClassName = 'aspect-square',
  className,
  fit = 'contain',
  onActiveIndexChange,
  renderSlideOverlay,
}: MediaCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollRef.current
    if (!container) return
    const clamped = Math.max(0, Math.min(index, items.length - 1))
    container.scrollTo({ left: container.clientWidth * clamped, behavior: 'smooth' })
  }, [items.length])

  const handleScroll = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    const index = Math.round(container.scrollLeft / container.clientWidth)
    setActiveIndex((prev) => {
      if (prev !== index) onActiveIndexChange?.(index)
      return index
    })
  }, [onActiveIndexChange])

  useEffect(() => {
    // Reseta ao trocar de conjunto de itens
    setActiveIndex(0)
    onActiveIndexChange?.(0)
  }, [items, onActiveIndexChange])

  if (items.length === 0) {
    return (
      <div className={cn('flex w-full items-center justify-center bg-black text-sm text-muted-foreground', aspectClassName, className)}>
        Arquivo não disponível
      </div>
    )
  }

  const hasMultiple = items.length > 1
  const fitClass = fit === 'cover' ? 'object-cover' : 'object-contain'

  return (
    <div className={cn('group relative w-full overflow-hidden bg-black', className)}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((media, index) => (
          <div
            key={`${media.url}-${index}`}
            className={cn('relative w-full shrink-0 snap-center', aspectClassName)}
          >
            {isVideoType(media) ? (
              <video
                src={media.url}
                className={cn('h-full w-full', fitClass)}
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={media.url || '/placeholder.svg'}
                alt={`${alt} ${index + 1}`}
                className={cn('h-full w-full', fitClass)}
              />
            )}
            {renderSlideOverlay?.(index)}
          </div>
        ))}
      </div>

      {hasMultiple && (
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition-opacity hover:bg-background disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Próximo"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === items.length - 1}
            className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition-opacity hover:bg-background disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Contador */}
          <div className="absolute right-3 top-3 z-10 rounded-full bg-background/70 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur">
            {activeIndex + 1}/{items.length}
          </div>

          {/* Indicadores */}
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
            {items.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Ir para o item ${index + 1}`}
                onClick={() => scrollToIndex(index)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index === activeIndex ? 'w-4 bg-background' : 'w-1.5 bg-background/50',
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
