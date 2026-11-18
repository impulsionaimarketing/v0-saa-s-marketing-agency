'use client'

import { useEffect } from 'react'

// Abre o diálogo de impressão ("Salvar como PDF") quando a página é aberta com ?print=1
export function AutoPrint() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('print') !== '1') return
    const timer = setTimeout(() => window.print(), 600)
    return () => clearTimeout(timer)
  }, [])
  return null
}
