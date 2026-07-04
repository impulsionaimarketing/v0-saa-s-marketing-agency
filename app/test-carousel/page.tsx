import { MediaCarousel } from '@/components/productions/media-carousel'

export default function TestCarouselPage() {
  const items = [
    { url: '/placeholder.svg?height=600&width=600&query=imagem+um', file_type: 'image/png' },
    { url: '/placeholder.svg?height=600&width=600&query=imagem+dois', file_type: 'image/png' },
    { url: '/placeholder.svg?height=600&width=600&query=imagem+tres', file_type: 'image/png' },
  ]
  return (
    <div className="mx-auto max-w-[480px] p-4">
      <h1 className="mb-4 text-lg font-semibold">Teste do carrossel ({items.length} itens)</h1>
      <div data-testid="carousel">
        <MediaCarousel items={items} alt="Teste" aspectClassName="aspect-square" />
      </div>
    </div>
  )
}
