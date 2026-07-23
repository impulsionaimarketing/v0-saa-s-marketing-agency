import { notFound } from 'next/navigation'
import { getClientPortalData } from '@/lib/data/approval'
import { ClientPortal } from './client-portal'

export const dynamic = 'force-dynamic'

export default async function ClientApprovalPortalPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const data = await getClientPortalData(clientId)

  if (!data) {
    notFound()
  }

  return <ClientPortal data={data} />
}
