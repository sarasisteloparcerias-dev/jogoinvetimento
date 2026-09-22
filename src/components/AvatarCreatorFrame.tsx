import { useEffect, useRef, useState } from 'react'

interface RpmMessage {
  source?: string
  eventName?: string
  data?: { url?: string }
}

interface AvatarCreatorFrameProps {
  onAvatarReady: (url: string) => void
}

const RPM_CREATOR_URL = 'https://demo.readyplayer.me/avatar?frameApi&bodyType=fullbody&quickStart=false&clearCache'

function parseRpmMessage(raw: unknown): RpmMessage | null {
  if (typeof raw !== 'string' || !raw.startsWith('{')) return null
  try {
    return JSON.parse(raw) as RpmMessage
  } catch {
    return null
  }
}

export function AvatarCreatorFrame({ onAvatarReady }: AvatarCreatorFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [carregado, setCarregado] = useState(false)
  const [demorouDemais, setDemorouDemais] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDemorouDemais(true), 12000)
    return () => clearTimeout(t)
  }, [])

  function inscrever() {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ target: 'readyplayerme', type: 'subscribe', eventName: 'v1.avatar.exported' }),
      '*',
    )
  }

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const json = parseRpmMessage(event.data)
      if (!json || json.source !== 'readyplayerme') return

      if (json.eventName === 'v1.frame.ready') {
        inscrever()
      }

      if (json.eventName === 'v1.avatar.exported' && json.data?.url) {
        onAvatarReady(json.data.url)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onAvatarReady])

  return (
    <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-50" style={{ height: 460 }}>
      {!carregado && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 px-6 text-center">
          <p>
            A carregar o criador de avatares…
            {demorouDemais && (
              <span className="block mt-2 text-xs text-slate-400">
                Está a demorar? Verifica a tua ligação à internet — esta parte precisa de acesso a
                readyplayer.me.
              </span>
            )}
          </p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="Criador de avatar Ready Player Me"
        src={RPM_CREATOR_URL}
        allow="camera *; microphone *; clipboard-write"
        className="w-full h-full border-0"
        style={{ visibility: carregado ? 'visible' : 'hidden' }}
        onLoad={() => {
          setCarregado(true)
          inscrever()
        }}
      />
    </div>
  )
}
