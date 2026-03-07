'use client'

import { useRef, useCallback, useEffect } from 'react'

const SCROLL_ZONE = 150   // px from edge of viewport to trigger scroll
const MAX_SPEED = 18      // max px per tick
const TICK_MS = 16        // ~60fps via setInterval

export function useDragScroll() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mouseXRef = useRef(0)
  const mouseYRef = useRef(0)

  const stopScroll = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Calculate speed based on proximity to edge (0 at edge of zone, MAX_SPEED at viewport edge)
  const calcSpeed = (distFromEdge: number) => {
    const ratio = Math.max(0, 1 - distFromEdge / SCROLL_ZONE)
    return Math.ceil(MAX_SPEED * ratio)
  }

  const onDocumentDragOver = useCallback((e: DragEvent) => {
    mouseXRef.current = e.clientX
    mouseYRef.current = e.clientY
  }, [])

  const onDragStart = useCallback(() => {
    document.addEventListener('dragover', onDocumentDragOver)

    intervalRef.current = setInterval(() => {
      const x = mouseXRef.current
      const y = mouseYRef.current
      const vw = window.innerWidth
      const vh = window.innerHeight

      // Horizontal page scroll
      if (x < SCROLL_ZONE) {
        window.scrollBy({ left: -calcSpeed(x), behavior: 'instant' })
      } else if (x > vw - SCROLL_ZONE) {
        window.scrollBy({ left: calcSpeed(vw - x), behavior: 'instant' })
      }

      // Vertical page scroll
      if (y < SCROLL_ZONE) {
        window.scrollBy({ top: -calcSpeed(y), behavior: 'instant' })
      } else if (y > vh - SCROLL_ZONE) {
        window.scrollBy({ top: calcSpeed(vh - y), behavior: 'instant' })
      }
    }, TICK_MS)
  }, [onDocumentDragOver])

  const onDragEnd = useCallback(() => {
    stopScroll()
    document.removeEventListener('dragover', onDocumentDragOver)
  }, [stopScroll, onDocumentDragOver])

  useEffect(() => {
    return () => {
      stopScroll()
      document.removeEventListener('dragover', onDocumentDragOver)
    }
  }, [stopScroll, onDocumentDragOver])

  return { onDragStart, onDragEnd }
}
