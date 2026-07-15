"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ModuleAccessWrapper } from "@/components/auth/module-access-wrapper"
import { AppShell } from "@/components/layout/app-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Images, CalendarClock, CalendarDays } from "lucide-react"
import { useStories } from "@/lib/hooks/use-stories"
import { useAuth } from "@/lib/hooks/use-auth"
import { ContentsTab } from "@/components/stories/contents-tab"
import { SchedulesTab } from "@/components/stories/schedules-tab"
import { CalendarTab } from "@/components/stories/calendar-tab"
import { InstagramImportModal } from "@/components/stories/instagram-import-modal"

interface Company {
  id: string
  name: string
}

export default function StoriesAutomaticosPage() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [instagramOpen, setInstagramOpen] = useState(false)

  // Carrega empresas (clientes)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/clients/search?name=")
        if (res.ok) {
          const data = await res.json()
          const list: Company[] = Array.isArray(data)
            ? data.map((c: any) => ({ id: c.id, name: c.name }))
            : []
          setCompanies(list)
          if (list.length > 0) setCompanyId((prev) => prev ?? list[0].id)
        }
      } catch (err) {
        console.error("[v0] Error loading companies:", err)
      }
    }
    load()
  }, [])

  const {
    contents,
    folders,
    automations,
    schedules,
    loading,
    uploadContent,
    importInstagramPosts,
    updateContent,
    deleteContent,
    deleteContents,
    moveContents,
    createSchedulesBatch,
    createFolder,
    renameFolder,
    deleteFolder,
    saveFolderAutomation,
    removeFolderAutomation,
    updateSchedule,
    scheduleAction,
    deleteSchedule,
  } = useStories(companyId)

  return (
    <ProtectedRoute>
      <ModuleAccessWrapper moduleName="stories_automaticos" moduleDisplayName="Stories Automáticos">
        <AppShell>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Stories Automáticos</h1>
                <p className="mt-1 text-muted-foreground">
                  Organize os conteúdos em pastas e acompanhe as publicações automáticas nos
                  Stories do Instagram.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="company" className="text-xs text-muted-foreground">
                  Empresa
                </Label>
                <Select value={companyId ?? undefined} onValueChange={setCompanyId}>
                  <SelectTrigger id="company" className="w-full sm:w-64">
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Abas */}
            <Tabs defaultValue="contents" className="w-full">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="contents" className="gap-2 data-[state=active]:bg-background">
                  <Images className="h-4 w-4" />
                  <span className="hidden sm:inline">Conteúdos</span>
                </TabsTrigger>
                <TabsTrigger value="schedules" className="gap-2 data-[state=active]:bg-background">
                  <CalendarClock className="h-4 w-4" />
                  <span className="hidden sm:inline">Agendamentos</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-2 data-[state=active]:bg-background">
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendário</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contents" className="mt-6">
                <ContentsTab
                  contents={contents}
                  folders={folders}
                  automations={automations}
                  loading={loading}
                  companies={companies}
                  companyId={companyId}
                  onCompanyChange={setCompanyId}
                  onUpload={uploadContent}
                  onUpdate={updateContent}
                  onDelete={deleteContent}
                  onDeleteMany={deleteContents}
                  onMove={moveContents}
                  onSchedule={createSchedulesBatch}
                  onCreateFolder={createFolder}
                  onRenameFolder={renameFolder}
                  onDeleteFolder={deleteFolder}
                  onSaveFolderAutomation={saveFolderAutomation}
                  onRemoveFolderAutomation={removeFolderAutomation}
                  onOpenInstagram={() => setInstagramOpen(true)}
                />
              </TabsContent>

              <TabsContent value="schedules" className="mt-6">
                <SchedulesTab
                  schedules={schedules}
                  loading={loading}
                  companies={companies}
                  companyId={companyId}
                  onCompanyChange={setCompanyId}
                  onUpdate={updateSchedule}
                  onAction={scheduleAction}
                  onDelete={deleteSchedule}
                />
              </TabsContent>

              <TabsContent value="calendar" className="mt-6">
                <CalendarTab
                  schedules={schedules}
                  loading={loading}
                  companies={companies}
                  companyId={companyId}
                  onCompanyChange={setCompanyId}
                  onUpdate={updateSchedule}
                  onAction={scheduleAction}
                  onDelete={deleteSchedule}
                />
              </TabsContent>
            </Tabs>
          </div>

          <InstagramImportModal
            companyId={companyId}
            open={instagramOpen}
            onClose={() => setInstagramOpen(false)}
            onImport={importInstagramPosts}
          />
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
