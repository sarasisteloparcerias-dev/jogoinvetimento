import { Suspense, lazy } from 'react'
import { AvatarErrorBoundary } from './AvatarErrorBoundary'

const Avatar3DImpl = lazy(() => import('./Avatar3D').then((m) => ({ default: m.Avatar3D })))

interface LazyAvatar3DProps {
  url: string
  size?: number
}

export function Avatar3D({ url, size = 96 }: LazyAvatar3DProps) {
  return (
    <AvatarErrorBoundary
      fallback={
        <div
          className="rounded-full bg-violet-100 flex items-center justify-center"
          style={{ width: size, height: size, fontSize: size * 0.5 }}
        >
          🧑
        </div>
      }
    >
      <Suspense fallback={<div className="rounded-full bg-slate-200 animate-pulse" style={{ width: size, height: size }} />}>
        <Avatar3DImpl url={url} size={size} />
      </Suspense>
    </AvatarErrorBoundary>
  )
}
