import { notFound } from 'next/navigation'
import { getProductionByToken } from '@/lib/data/approval'
import { ApprovalClient } from './approval-client'

export default async function PublicApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const productions = await getProductionByToken(token)

  if (!productions || productions.length === 0) {
    notFound()
  }

  return <ApprovalClient productions={productions} token={token} />
}
