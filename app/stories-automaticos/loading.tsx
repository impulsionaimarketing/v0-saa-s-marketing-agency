import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-72" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
        ))}
      </div>
    </div>
  )
}
