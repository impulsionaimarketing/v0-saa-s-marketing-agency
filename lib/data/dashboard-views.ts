'use client'

import type { DashboardView } from '@/lib/types/dashboard'

const STORAGE_KEY = 'dashboard_views'

// Client-side only functions for managing dashboard views
export function getDashboardViewsLocal(context: string): DashboardView[] {
  try {
    if (typeof window === 'undefined') return []
    
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const views: DashboardView[] = JSON.parse(stored)
    return views.filter(v => v.context === context).sort((a, b) => {
      if (a.isDefault !== b.isDefault) return b.isDefault ? 1 : -1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  } catch (error) {
    console.error('[v0] Error getting dashboard views:', error)
    return []
  }
}

export function getDefaultDashboardViewLocal(context: string): DashboardView | null {
  try {
    const views = getDashboardViewsLocal(context)
    return views.find(v => v.isDefault) || null
  } catch (error) {
    console.error('[v0] Error getting default dashboard view:', error)
    return null
  }
}

export function createDashboardViewLocal(view: Omit<DashboardView, 'id' | 'createdAt' | 'updatedAt'>): DashboardView {
  try {
    if (typeof window === 'undefined') throw new Error('Only available in browser')
    
    const now = new Date().toISOString()
    const newView: DashboardView = {
      ...view,
      id: `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    }
    
    const stored = localStorage.getItem(STORAGE_KEY)
    const views: DashboardView[] = stored ? JSON.parse(stored) : []
    
    views.push(newView)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views))
    
    console.log('[v0] Dashboard view created:', newView.id)
    return newView
  } catch (error) {
    console.error('[v0] Error creating dashboard view:', error)
    throw error
  }
}

export function updateDashboardViewLocal(id: string, updates: Partial<DashboardView>): DashboardView {
  try {
    if (typeof window === 'undefined') throw new Error('Only available in browser')
    
    const stored = localStorage.getItem(STORAGE_KEY)
    const views: DashboardView[] = stored ? JSON.parse(stored) : []
    
    const index = views.findIndex(v => v.id === id)
    if (index === -1) throw new Error(`View not found: ${id}`)
    
    const updatedView: DashboardView = {
      ...views[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    
    views[index] = updatedView
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views))
    
    console.log('[v0] Dashboard view updated:', id)
    return updatedView
  } catch (error) {
    console.error('[v0] Error updating dashboard view:', error)
    throw error
  }
}

export function deleteDashboardViewLocal(id: string): void {
  try {
    if (typeof window === 'undefined') throw new Error('Only available in browser')
    
    const stored = localStorage.getItem(STORAGE_KEY)
    const views: DashboardView[] = stored ? JSON.parse(stored) : []
    
    const filtered = views.filter(v => v.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    
    console.log('[v0] Dashboard view deleted:', id)
  } catch (error) {
    console.error('[v0] Error deleting dashboard view:', error)
    throw error
  }
}

export function setDefaultDashboardViewLocal(context: string, viewId: string): DashboardView {
  try {
    if (typeof window === 'undefined') throw new Error('Only available in browser')
    
    const stored = localStorage.getItem(STORAGE_KEY)
    const views: DashboardView[] = stored ? JSON.parse(stored) : []
    
    const viewIndex = views.findIndex(v => v.id === viewId)
    if (viewIndex === -1) throw new Error(`View not found: ${viewId}`)
    
    // Remove default from all other views in this context
    views.forEach(v => {
      if (v.context === context && v.id !== viewId) {
        v.isDefault = false
        v.updatedAt = new Date().toISOString()
      }
    })
    
    // Set new default
    views[viewIndex].isDefault = true
    views[viewIndex].updatedAt = new Date().toISOString()
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views))
    
    console.log('[v0] Default dashboard view set:', viewId)
    return views[viewIndex]
  } catch (error) {
    console.error('[v0] Error setting default dashboard view:', error)
    throw error
  }
}
