import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-500" />
        <p className="mt-2 text-amber-700">Carregando detalhes do evento...</p>
      </div>
    </div>
  )
}

