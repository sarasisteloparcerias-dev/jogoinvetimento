import { Center, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'

function otimizarUrl(url: string) {
  const separador = url.includes('?') ? '&' : '?'
  return `${url}${separador}pose=A&quality=medium&textureAtlas=1024`
}

function ModeloAvatar({ url }: { url: string }) {
  const { scene } = useGLTF(otimizarUrl(url))
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  )
}

interface Avatar3DProps {
  url: string
  size?: number
}

export function Avatar3D({ url, size = 96 }: Avatar3DProps) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas camera={{ position: [0, 0, 2.6], fov: 32 }} dpr={[1, 1.5]}>
        <ambientLight intensity={1} />
        <directionalLight position={[2, 3, 3]} intensity={1.3} />
        <directionalLight position={[-2, 1, -2]} intensity={0.4} />
        <Suspense fallback={null}>
          <ModeloAvatar url={url} />
        </Suspense>
      </Canvas>
    </div>
  )
}
