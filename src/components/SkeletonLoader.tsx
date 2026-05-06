interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
}

export function Skeleton({ className = '', width, height, rounded = 'md' }: SkeletonProps) {
  const roundedClass = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  }[rounded]

  return (
    <div 
      className={`skeleton ${roundedClass} ${className}`}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height 
      }}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-4 border border-gray-200 dark:border-dark-border">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton width={40} height={40} rounded="full" />
        <div className="flex-1">
          <Skeleton height={16} className="mb-2" />
          <Skeleton height={12} width="60%" />
        </div>
      </div>
      <Skeleton height={12} className="mb-2" />
      <Skeleton height={12} width="80%" className="mb-2" />
      <Skeleton height={12} width="40%" />
    </div>
  )
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton width={32} height={32} rounded="md" />
      <div className="flex-1">
        <Skeleton height={14} className="mb-1" />
        <Skeleton height={10} width="50%" />
      </div>
      <Skeleton width={60} height={24} rounded="md" />
    </div>
  )
}

export function EditorSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton height={32} width="70%" />
      <div className="space-y-2">
        <Skeleton height={14} />
        <Skeleton height={14} width="90%" />
        <Skeleton height={14} width="95%" />
        <Skeleton height={14} width="80%" />
      </div>
      <div className="pt-4 space-y-2">
        <Skeleton height={14} />
        <Skeleton height={14} width="85%" />
        <Skeleton height={14} width="92%" />
        <Skeleton height={14} width="70%" />
      </div>
    </div>
  )
}
