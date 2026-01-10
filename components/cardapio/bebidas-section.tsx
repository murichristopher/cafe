import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BEBIDAS_OPTIONS } from "@/lib/cardapio/constants"

interface BebidasSectionProps {
  bebidas: Array<{ nome: string; quantidade: string }>
  bebidaCustom: string
  bebidaQuantidade: string
  onToggle: (bebida: string) => void
  onQuantidadeChange: (nome: string, quantidade: string) => void
  onAddCustom: () => void
  onCustomChange: (value: string) => void
  onQuantidadeInputChange: (value: string) => void
  onRemove: (nome: string) => void
  isLoading: boolean
}

export function BebidasSection({
  bebidas,
  bebidaCustom,
  bebidaQuantidade,
  onToggle,
  onQuantidadeChange,
  onAddCustom,
  onCustomChange,
  onQuantidadeInputChange,
  onRemove,
  isLoading,
}: BebidasSectionProps) {
  return (
    <div className="space-y-3">
      <Label className="text-lg font-semibold text-white">Bebidas *</Label>
      <div className="border border-zinc-700 rounded-md p-4 bg-zinc-900">
        <div className="grid grid-cols-2 gap-4">
          {BEBIDAS_OPTIONS.map((bebida) => {
            const bebidaSelecionada = bebidas.find((b) => b.nome === bebida)
            return (
              <div key={bebida} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`bebida-${bebida}`}
                  checked={!!bebidaSelecionada}
                  onChange={() => onToggle(bebida)}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-zinc-600 text-yellow-400 focus:ring-yellow-400 bg-zinc-800"
                />
                <label htmlFor={`bebida-${bebida}`} className="text-sm text-white cursor-pointer flex-1">
                  {bebida}
                </label>
                {bebidaSelecionada && (
                  <Input
                    type="number"
                    min="1"
                    value={bebidaSelecionada.quantidade}
                    onChange={(e) => onQuantidadeChange(bebida, e.target.value)}
                    className="w-20 h-8"
                    disabled={isLoading}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bebida-custom" className="text-sm">
          Adicionar bebida customizada
        </Label>
        <div className="flex gap-2">
          <Input
            id="bebida-custom"
            placeholder="Nome da bebida"
            value={bebidaCustom}
            onChange={(e) => onCustomChange(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Input
            placeholder="Qtd"
            type="number"
            min="1"
            value={bebidaQuantidade}
            onChange={(e) => onQuantidadeInputChange(e.target.value)}
            disabled={isLoading}
            className="w-20"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onAddCustom}
            disabled={isLoading || !bebidaCustom.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {bebidas.filter((b) => !BEBIDAS_OPTIONS.includes(b.nome)).length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Bebidas customizadas:</Label>
          <div className="space-y-2">
            {bebidas
              .filter((b) => !BEBIDAS_OPTIONS.includes(b.nome))
              .map((bebida, index) => (
                <div key={index} className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-md">
                  <span className="text-sm text-white flex-1">{bebida.nome}</span>
                  <Input
                    type="number"
                    min="1"
                    value={bebida.quantidade}
                    onChange={(e) => onQuantidadeChange(bebida.nome, e.target.value)}
                    className="w-20 h-8"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(bebida.nome)}
                    className="h-5 w-5 text-red-500 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

