"use client"

import { useCallback, useEffect, useState } from "react"
import type {
  StoryContent,
  StoryAutomation,
  StoryPublicationHistory,
  StorySummary,
  UpdateStoryContentInput,
  UpsertStoryAutomationInput,
  CreateStoryContentInput,
  InstagramMedia,
} from "@/lib/types/stories"

// Hook central de estado da funcionalidade "Stories Automáticos".
// Centraliza fetch/CRUD de conteúdos, automação, histórico e resumo
// para uma empresa (companyId).
export function useStories(companyId: string | null) {
  const [summary, setSummary] = useState<StorySummary | null>(null)
  const [contents, setContents] = useState<StoryContent[]>([])
  const [automation, setAutomation] = useState<StoryAutomation | null>(null)
  const [history, setHistory] = useState<StoryPublicationHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!companyId) {
      setSummary(null)
      setContents([])
      setAutomation(null)
      setHistory([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [summaryRes, contentsRes, automationRes, historyRes] = await Promise.all([
        fetch(`/api/stories/summary?companyId=${companyId}`),
        fetch(`/api/stories/contents?companyId=${companyId}`),
        fetch(`/api/stories/automation?companyId=${companyId}`),
        fetch(`/api/stories/history?companyId=${companyId}`),
      ])

      if (summaryRes.ok) setSummary(await summaryRes.json())
      if (contentsRes.ok) setContents(await contentsRes.json())
      if (automationRes.ok) setAutomation(await automationRes.json())
      if (historyRes.ok) setHistory(await historyRes.json())
    } catch (err) {
      console.error("[v0] Error loading stories data:", err)
      setError("Falha ao carregar dados dos Stories Automáticos")
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ---- Conteúdos ----

  const refreshContents = useCallback(async () => {
    if (!companyId) return
    const res = await fetch(`/api/stories/contents?companyId=${companyId}`)
    if (res.ok) setContents(await res.json())
    const summaryRes = await fetch(`/api/stories/summary?companyId=${companyId}`)
    if (summaryRes.ok) setSummary(await summaryRes.json())
  }, [companyId])

  // Faz upload do arquivo e cria o registro de conteúdo
  const uploadContent = useCallback(
    async (file: File) => {
      if (!companyId) return
      const uploadRes = await fetch(
        `/api/stories/upload?filename=${encodeURIComponent(file.name)}`,
        {
          method: "POST",
          headers: { "content-type": file.type },
          body: file,
        },
      )
      if (!uploadRes.ok) throw new Error("Falha no upload")
      const { url } = await uploadRes.json()

      const type = file.type.startsWith("video") ? "video" : "image"
      const payload: CreateStoryContentInput = {
        company_id: companyId,
        type,
        source: "upload",
        file_url: url,
        thumbnail_url: type === "image" ? url : null,
      }
      const createRes = await fetch(`/api/stories/contents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!createRes.ok) throw new Error("Falha ao salvar conteúdo")
      await refreshContents()
    },
    [companyId, refreshContents],
  )

  // Importa posts selecionados do Instagram
  const importInstagramPosts = useCallback(
    async (media: InstagramMedia[]) => {
      if (!companyId || media.length === 0) return
      const items: CreateStoryContentInput[] = media.map((m) => ({
        company_id: companyId,
        type: m.media_type === "VIDEO" ? "video" : "image",
        source: "instagram",
        file_url: m.media_url,
        thumbnail_url: m.thumbnail_url ?? m.media_url,
        caption: m.caption ?? null,
        instagram_media_id: m.id,
        instagram_permalink: m.permalink,
      }))
      const res = await fetch(`/api/stories/contents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) throw new Error("Falha ao importar posts")
      await refreshContents()
    },
    [companyId, refreshContents],
  )

  const updateContent = useCallback(
    async (id: string, input: UpdateStoryContentInput) => {
      const res = await fetch(`/api/stories/contents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error("Falha ao atualizar conteúdo")
      await refreshContents()
    },
    [refreshContents],
  )

  const deleteContent = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/stories/contents/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Falha ao excluir conteúdo")
      await refreshContents()
    },
    [refreshContents],
  )

  // ---- Automação ----

  const saveAutomation = useCallback(
    async (input: Omit<UpsertStoryAutomationInput, "company_id">) => {
      if (!companyId) return
      const res = await fetch(`/api/stories/automation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, company_id: companyId }),
      })
      if (!res.ok) throw new Error("Falha ao salvar automação")
      const updated = await res.json()
      setAutomation(updated)
      const summaryRes = await fetch(`/api/stories/summary?companyId=${companyId}`)
      if (summaryRes.ok) setSummary(await summaryRes.json())
      return updated as StoryAutomation
    },
    [companyId],
  )

  return {
    summary,
    contents,
    automation,
    history,
    loading,
    error,
    refresh: fetchAll,
    uploadContent,
    importInstagramPosts,
    updateContent,
    deleteContent,
    saveAutomation,
  }
}

// Hook auxiliar para listar posts do Instagram conectado
export function useInstagramPosts(companyId: string | null) {
  const [media, setMedia] = useState<InstagramMedia[]>([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchPosts = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/stories/instagram?companyId=${companyId}`)
      if (res.ok) {
        const data = await res.json()
        setMedia(data.media || [])
        setConnected(Boolean(data.connected))
      }
    } catch (err) {
      console.error("[v0] Error fetching instagram posts:", err)
    } finally {
      setLoading(false)
    }
  }, [companyId])

  return { media, connected, loading, fetchPosts }
}
