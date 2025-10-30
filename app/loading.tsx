import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex h-screen">
      <div className="w-64 border-r border-gray-200 p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-8 space-y-6">
          <Skeleton className="h-20 w-full max-w-3xl mx-auto" />
          <Skeleton className="h-32 w-full max-w-3xl mx-auto" />
        </div>
      </div>
    </div>
  );
}
