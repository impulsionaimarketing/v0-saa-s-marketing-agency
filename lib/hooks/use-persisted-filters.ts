'use client'

import { useState, useEffect, useCallback } from 'react'

function getStoredValue<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const stored = localStorage.getItem(key)
    return stored !== null ? (JSON.parse(stored) as T) : defaultValue
  } catch {
    return defaultValue
  }
}

export function usePersistedFilters<T extends Record<string, string>>(
  storageKey: string,
  defaults: T
): [T, (key: keyof T, value: string) => void, () => void] {
  const [filters, setFilters] = useState<T>(() =>
    getStoredValue<T>(storageKey, defaults)
  )

  // Persist to localStorage whenever filters change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(filters))
    }
  }, [filters, storageKey])

  const setFilter = useCallback((key: keyof T, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(defaults)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
    }
  }, [defaults, storageKey])

  return [filters, setFilter, resetFilters]
}
