import { Component, type ReactNode } from 'react'

interface AvatarErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
}

interface AvatarErrorBoundaryState {
  temErro: boolean
}

export class AvatarErrorBoundary extends Component<AvatarErrorBoundaryProps, AvatarErrorBoundaryState> {
  state: AvatarErrorBoundaryState = { temErro: false }

  static getDerivedStateFromError() {
    return { temErro: true }
  }

  componentDidCatch(erro: unknown) {
    console.error('Falha ao carregar o avatar 3D:', erro)
  }

  render() {
    if (this.state.temErro) return this.props.fallback
    return this.props.children
  }
}
