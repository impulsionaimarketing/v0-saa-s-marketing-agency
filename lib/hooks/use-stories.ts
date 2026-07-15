"use client"

import { useCallback, useEffect, useState } from "react"
import type {
  StoryContent,
  StoryPublicationHistory,
  StorySummary,
  StoryFolder,
  StorySchedule,
  UpdateStoryContentInput,
  CreateStoryContentInput,
  ScheduleConfigInput,
  InstagramMedia,
} from "@/lib/types/stories"

// Hook central de estado do gerenciador de Stories.
// Centraliza conteúdos, pastas, agendamentos, histórico e resumo
// para uma empresa (companyId).
export function useStories(companyId: string | null) {
  const [summary, setSummary] = useState<StorySummary | null>(null)
  const [contents, setContents] = useState<StoryContent[]>([])
  const [folders, setFolders] = useState<StoryFolder[]>([])
  const [schedules, setSchedules] = useState<StorySchedule[]>([])
  const [history, setHistory] = useState<StoryPublicationHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!companyId) {
      setSummary(null)
      setContents([])
      setFolders([])
      setSchedules([])
      setHistory([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [summaryRes, contentsRes, foldersRes, schedulesRes, historyRes] = await Promise.all([
        fetch(`/api/stories/summary?companyId=${companyId}`),
        fetch(`/api/stories/contents?companyId=${companyId}`),
        fetch(`/api/stories/folders?companyId=${companyId}`),
        fetch(`/api/stories/schedules?companyId=${companyId}`),
        fetch(`/api/stories/history?companyId=${companyId}`),
      ])

      if (summaryRes.ok) setSummary(await summaryRes.json())
      if (contentsRes.ok) setContents(await contentsRes.json())
      if (foldersRes.ok) setFolders(await foldersRes.json())
      if (schedulesRes.ok) setSchedules(await schedulesRes.json())
      if (historyRes.ok) setHistory(await historyRes.json())
    } catch (err) {
      console.error("[v0] Error loading stories data:", err)
      setError("Falha ao carregar dados dos Stories")
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Recarrega conteúdos + resumo + agendamentos (sem reload de página)
  const refreshContents = useCallback(async () => {
    if (!companyId) return
    const [contentsRes, summaryRes, schedulesRes] = await Promise.all([
      fetch(`/api/stories/contents?companyId=${companyId}`),
      fetch(`/api/stories/summary?companyId=${companyId}`),
      fetch(`/api/stories/schedules?companyId=${companyId}`),
    ])
    if (contentsRes.ok) setContents(await contentsRes.json())
    if (summaryRes.ok) setSummary(await summaryRes.json())
    if (schedulesRes.ok) setSchedules(await schedulesRes.json())
  }, [companyId])

  const refreshFolders = useCallback(async () => {
    if (!companyId) return
    const res = await fetch(`/api/stories/folders?companyId=${companyId}`)
    if (res.ok) setFolders(await res.json())
  }, [companyId])

  const refreshSchedules = useCallback(async () => {
    if (!companyId) return
    const res = await fetch(`/api/stories/schedules?companyId=${companyId}`)
    if (res.ok) setSchedules(await res.json())
  }, [companyId])

  // ---- Conteúdos ----

  // Upload otimista: cria placeholder na UI e substitui ao concluir
  const uploadContent = useCallback(
    async (file: File, folderId: string | null = null) => {
      if (!companyId) return
      const uploadRes = await fetch(
        `/api/stories/upload?filename=${encodeURIComponent(file.name)}`,
        { method: "POST", headers: { "content-type": file.type }, body: file },
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
        name: file.name,
        folder_id: folderId,
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

  const importInstagramPosts = useCallback(
    async (media: InstagramMedia[], folderId: string | null = null) => {
      if (!companyId || media.length === 0) return
      const items: CreateStoryContentInput[] = media.map((m) => ({
        company_id: companyId,
        type: m.media_type === "VIDEO" ? "video" : "image",
        source: "instagram",
        file_url: m.media_url,
        thumbnail_url: m.thumbnail_url ?? m.media_url,
        caption: m.caption ?? null,
        folder_id: folderId,
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

  const moveContents = useCallback(
    async (ids: string[], folderId: string | null) => {
      const res = await fetch(`/api/stories/contents/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, folderId }),
      })
      if (!res.ok) throw new Error("Falha ao mover conteúdos")
      await Promise.all([refreshContents(), refreshFolders()])
    },
    [refreshContents, refreshFolders],
  )

  const deleteContents = useCallback(
    async (ids: string[]) => {
      const res = await fetch(`/api/stories/contents/move`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) throw new Error("Falha ao excluir conteúdos")
      await Promise.all([refreshContents(), refreshFolders()])
    },
    [refreshContents, refreshFolders],
  )

  // ---- Pastas ----

  const createFolder = useCallback(
    async (name: string) => {
      if (!companyId) return
      const res = await fetch(`/api/stories/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId, name }),
      })
      if (!res.ok) throw new Error("Falha ao criar pasta")
      const folder = (await res.json()) as StoryFolder
      await refreshFolders()
      return folder
    },
    [companyId, refreshFolders],
  )

  const renameFolder = useCallback(
    async (id: string, name: string) => {
      const res = await fetch(`/api/stories/folders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error("Falha ao renomear pasta")
      await refreshFolders()
    },
    [refreshFolders],
  )

  const deleteFolder = useCallback(
    async (id: string, moveTo?: string | null) => {
      const query = moveTo ? `?moveTo=${moveTo}` : ""
      const res = await fetch(`/api/stories/folders/${id}${query}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Falha ao excluir pasta")
      await Promise.all([refreshFolders(), refreshContents()])
    },
    [refreshFolders, refreshContents],
  )

  // ---- Agendamentos ----

  const createSchedule = useCallback(
    async (contentId: string, config: ScheduleConfigInput) => {
      if (!companyId) return
      const res = await fetch(`/api/stories/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId, content_id: contentId, ...config }),
      })
      if (!res.ok) throw new Error("Falha ao criar agendamento")
      await Promise.all([refreshSchedules(), refreshContents()])
    },
    [companyId, refreshSchedules, refreshContents],
  )

  const createSchedulesBatch = useCallback(
    async (contentIds: string[], config: ScheduleConfigInput) => {
      if (!companyId || contentIds.length === 0) return
      const res = await fetch(`/api/stories/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId, contentIds, config }),
      })
      if (!res.ok) throw new Error("Falha ao agendar conteúdos")
      await Promise.all([refreshSchedules(), refreshContents()])
    },
    [companyId, refreshSchedules, refreshContents],
  )

  const updateSchedule = useCallback(
    async (id: string, config: ScheduleConfigInput) => {
      const res = await fetch(`/api/stories/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error("Falha ao atualizar agendamento")
      await Promise.all([refreshSchedules(), refreshContents()])
    },
    [refreshSchedules, refreshContents],
  )

  const scheduleAction = useCallback(
    async (id: string, action: "pause" | "resume" | "duplicate") => {
      const res = await fetch(`/api/stories/schedules/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error("Falha na ação do agendamento")
      await Promise.all([refreshSchedules(), refreshContents()])
    },
    [refreshSchedules, refreshContents],
  )

  const deleteSchedule = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/stories/schedules/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Falha ao excluir agendamento")
      await Promise.all([refreshSchedules(), refreshContents()])
    },
    [refreshSchedules, refreshContents],
  )

  return {
    summary,
    contents,
    folders,
    schedules,
    history,
    loading,
    error,
    refresh: fetchAll,
    // conteúdos
    uploadContent,
    importInstagramPosts,
    updateContent,
    deleteContent,
    moveContents,
    deleteContents,
    // pastas
    createFolder,
    renameFolder,
    deleteFolder,
    // agendamentos
    createSchedule,
    createSchedulesBatch,
    updateSchedule,
    scheduleAction,
    deleteSchedule,
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
