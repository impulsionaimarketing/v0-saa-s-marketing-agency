import { notFound } from 'next/navigation'
import { getProductionByToken } from '@/lib/data/approval'
import { ApprovalClient } from './approval-client'

export default async function PublicApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const production = await getProductionByToken(token)

  if (!production) {
    notFound()
  }

  return <ApprovalClient production={production} token={token} />
}
