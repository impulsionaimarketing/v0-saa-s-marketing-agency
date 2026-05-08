'use client'

import { Production } from '@/lib/data/productions'
import { Badge } from '@/components/ui/badge'
import { Video, FileText, Image } from 'lucide-react'

interface MediaPreviewProps {
  production: Production
}

export function MediaPreview({ production }: MediaPreviewProps) {
  const hasMedia = production.media_url || production.reference_url
  const hasScript = production.script || production.description

  return (
    <div className="relative w-full aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-2xl overflow-hidden">
      {hasMedia ? (
        // Mostrar mídia
        <>
          {production.media_url?.includes('youtube') || production.reference_url?.includes('youtube') ? (
            <iframe
              src={production.media_url || production.reference_url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : production.media_url?.includes('tiktok') || production.reference_url?.includes('tiktok') ? (
            <div className="w-full h-full flex items-center justify-center bg-black text-white">
              <div className="text-center space-y-2">
                <Video className="w-12 h-12 mx-auto" />
                <p className="text-sm">TikTok - Preview</p>
                <a 
                  href={production.media_url || production.reference_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline text-xs"
                >
                  Abrir no TikTok
                </a>
              </div>
            </div>
          ) : (
            <video
              src={production.media_url || production.reference_url}
              className="w-full h-full object-cover"
              controls
            />
          )}
        </>
      ) : hasScript ? (
        // Mostrar roteiro/descrição
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="text-center space-y-3 max-w-md">
            <FileText className="w-10 h-10 mx-auto text-gray-400" />
            <p className="text-sm text-gray-500 font-medium">Roteiro / Ideia</p>
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
              {production.script || production.description}
            </p>
          </div>
        </div>
      ) : (
        // Sem mídia nem roteiro
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="text-center space-y-2">
            <Image className="w-8 h-8 mx-auto text-gray-300" />
            <p className="text-xs text-gray-400">Sem mídia disponível</p>
          </div>
        </div>
      )}
      
      {/* Tipo badge */}
      <div className="absolute top-3 right-3">
        <Badge variant="secondary" className="bg-black/60 text-white border-0 backdrop-blur-sm">
          {production.type === 'Vídeo' ? <Video className="w-3 h-3 mr-1" /> : <Image className="w-3 h-3 mr-1" />}
          {production.type}
        </Badge>
      </div>
    </div>
  )
}